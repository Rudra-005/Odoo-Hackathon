from django.contrib import admin
from apps.common.admin import BaseModelAdmin
from .models import MaintenanceType, MaintenanceLog

@admin.register(MaintenanceType)
class MaintenanceTypeAdmin(BaseModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(MaintenanceLog)
class MaintenanceLogAdmin(BaseModelAdmin):
    list_display = (
        'maintenance_id', 'vehicle', 'maintenance_type', 'priority', 
        'maintenance_start', 'maintenance_end', 'estimated_cost', 'actual_cost', 'status_badge'
    )
    list_filter = ('status', 'priority', 'maintenance_type')
    search_fields = (
        'maintenance_id', 'vehicle__registration_number', 'vendor', 
        'mechanic_name', 'invoice_number'
    )
    
    fieldsets = (
        ('Maintenance Information', {
            'fields': (
                'maintenance_id', 'vehicle', 'maintenance_type', 'priority',
                'issue', 'diagnosis', 'description'
            )
        }),
        ('Vendor & Workshop', {
            'fields': ('workshop', 'vendor', 'mechanic_name', 'mechanic_contact')
        }),
        ('Cost & Invoicing', {
            'fields': (
                'estimated_cost', 'actual_cost', 'invoice_number', 'invoice_upload'
            )
        }),
        ('Timeline (Precision Scheduling)', {
            'fields': ('maintenance_start', 'maintenance_end', 'start_date', 'estimated_completion', 'actual_completion')
        }),
        ('Parts & Warranty', {
            'fields': ('parts_used', 'warranty', 'remarks')
        }),
        ('Status', {
            'fields': ('status',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('vehicle', 'maintenance_type')

    @admin.display(description="Status")
    def status_badge(self, obj):
        return self.get_status_badge(obj.status)
