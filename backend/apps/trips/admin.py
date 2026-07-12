from django.contrib import admin
from django.db.models import Q
from apps.common.admin import BaseModelAdmin
from .models import Trip, TripHistory

class TripHistoryInline(admin.TabularInline):
    model = TripHistory
    extra = 0
    readonly_fields = ('changed_by', 'old_status', 'new_status', 'notes', 'created_at')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False

class TripScheduleFilter(admin.SimpleListFilter):
    title = 'Schedule Classification'
    parameter_name = 'schedule_class'

    def lookups(self, request, model_admin):
        return (
            ('today', "Today's Trips"),
            ('upcoming', 'Upcoming Trips'),
            ('current', 'Current Trips (Active)'),
        )

    def queryset(self, request, queryset):
        from django.utils import timezone
        today = timezone.now().date()
        if self.value() == 'today':
            return queryset.filter(
                Q(planned_start_time__date=today) |
                Q(planned_end_time__date=today) |
                Q(status__in=['DISPATCHED', 'IN_PROGRESS'])
            )
        if self.value() == 'upcoming':
            return queryset.filter(
                status__in=['DRAFT', 'DISPATCHED'],
                planned_start_time__gt=timezone.now()
            )
        if self.value() == 'current':
            return queryset.filter(status__in=['DISPATCHED', 'IN_PROGRESS'])
        return queryset

@admin.register(Trip)
class TripAdmin(BaseModelAdmin):
    inlines = [TripHistoryInline]
    list_display = (
        'trip_number', 'vehicle', 'driver', 'source', 'destination', 
        'planned_start_time', 'planned_end_time', 'overlapping_warnings', 'status_badge'
    )
    list_filter = (TripScheduleFilter, 'status', 'region', 'cargo_type')
    search_fields = ('trip_number', 'vehicle__registration_number', 'driver__first_name', 'driver__last_name', 'source', 'destination', 'customer_name')
    
    fieldsets = (
        ('Trip Information', {
            'fields': (
                'trip_number', 'source', 'destination', 'intermediate_stops', 
                'region', 'customer_name', 'customer_contact'
            )
        }),
        ('Assignments', {
            'fields': ('vehicle', 'driver')
        }),
        ('Cargo Details', {
            'fields': ('cargo_type', 'cargo_weight', 'cargo_description')
        }),
        ('Scheduling Bounds (UTC)', {
            'fields': ('planned_start_time', 'planned_end_time')
        }),
        ('Actual Odoo Timeline', {
            'fields': ('actual_start_time', 'actual_end_time', 'dispatch_date', 'start_time', 'arrival_date', 'completion_date')
        }),
        ('Distance & Time', {
            'fields': (
                'planned_distance', 'actual_distance', 
                'estimated_duration', 'actual_duration'
            )
        }),
        ('Financial & Operational', {
            'fields': ('revenue', 'fuel_consumed', 'start_odometer', 'end_odometer')
        }),
        ('Status & Remarks', {
            'fields': ('status', 'remarks')
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('vehicle', 'driver', 'region')

    @admin.display(description="Status")
    def status_badge(self, obj):
        return self.get_status_badge(obj.status)

    @admin.display(description="Warnings")
    def overlapping_warnings(self, obj):
        from django.utils.html import format_html
        from apps.trips.scheduling import SchedulingEngine
        from django.core.exceptions import ValidationError
        
        if not obj.planned_start_time or not obj.planned_end_time:
            return "-"
            
        warnings = []
        try:
            SchedulingEngine.check_vehicle_collision(obj.vehicle, obj.planned_start_time, obj.planned_end_time, exclude_trip_id=obj.id)
        except ValidationError:
            warnings.append("Vehicle Double Booked")
            
        try:
            SchedulingEngine.check_driver_collision(obj.driver, obj.planned_start_time, obj.planned_end_time, exclude_trip_id=obj.id)
        except ValidationError:
            warnings.append("Driver Double Booked")
            
        try:
            SchedulingEngine.check_maintenance_collision(obj.vehicle, obj.planned_start_time, obj.planned_end_time)
        except ValidationError:
            warnings.append("Vehicle Under Maintenance")

        if warnings:
            return format_html('<span style="color: #ef4444; font-weight: bold; background: #fee2e2; padding: 2px 6px; border-radius: 4px;">⚠️ {}</span>', ", ".join(warnings))
        return "OK"
