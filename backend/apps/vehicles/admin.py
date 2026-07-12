from django.contrib import admin
from django.utils.html import format_html
from apps.common.admin import BaseModelAdmin
from .models import VehicleType, Vehicle, VehicleDocument

@admin.register(VehicleType)
class VehicleTypeAdmin(BaseModelAdmin):
    list_display = ('name', 'description')

class VehicleDocumentInline(admin.TabularInline):
    model = VehicleDocument
    extra = 1
    fields = ('document_type', 'image_url', 'expiry_date')

@admin.register(Vehicle)
class VehicleAdmin(BaseModelAdmin):
    inlines = [VehicleDocumentInline]
    list_display = (
        'image_thumbnail', 'registration_number', 'vehicle_name', 
        'vehicle_type', 'current_availability', 'status_badge', 'region', 
        'maximum_load_capacity', 'current_odometer', 'created_at'
    )
    list_editable = ()
    search_fields = ('registration_number', 'vehicle_name', 'vin_number')
    list_filter = ('status', 'vehicle_type', 'region')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('company', 'region', 'vehicle_type', 'vehicle_name', 'image', 'status')
        }),
        ('Technical Details', {
            'fields': ('registration_number', 'vin_number', 'model', 'manufacturer', 'year', 'fuel_type', 'maximum_load_capacity', 'current_odometer')
        }),
        ('Financial', {
            'fields': ('acquisition_cost', 'purchase_date')
        }),
        ('Documents', {
            'fields': ('insurance_number', 'insurance_expiry', 'fitness_expiry')
        })
    )

    actions = ['mark_available', 'mark_in_shop', 'retire_vehicle', 'export_as_csv']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('company', 'region', 'vehicle_type')

    @admin.display(description="Availability")
    def current_availability(self, obj):
        from django.utils.html import format_html
        if obj.status == 'AVAILABLE':
            return format_html('<span style="color: #22c55e; font-weight: bold;">🟢 Available</span>')
        elif obj.status == 'ON_TRIP':
            return format_html('<span style="color: #3b82f6; font-weight: bold;">🔵 On Trip</span>')
        elif obj.status in ['MAINTENANCE', 'IN_SHOP']:
            return format_html('<span style="color: #f97316; font-weight: bold;">🟡 In Shop</span>')
        else:
            return format_html('<span style="color: #ef4444; font-weight: bold;">🔴 Unavailable</span>')

    @admin.display(description="Status Badge")
    def status_badge(self, obj):
        return self.get_status_badge(obj.status)
        
    @admin.display(description="Image")
    def image_thumbnail(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 45px; height: 45px; border-radius: 8px; object-fit: cover;" />', obj.image)
        return format_html('<div style="width: 45px; height: 45px; background: #e2e8f0; border-radius: 8px;"></div>')

    @admin.action(description="Mark selected vehicles as Available")
    def mark_available(self, request, queryset):
        queryset.update(status='AVAILABLE')

    @admin.action(description="Mark selected vehicles as In Shop")
    def mark_in_shop(self, request, queryset):
        queryset.update(status='MAINTENANCE')

    @admin.action(description="Retire selected vehicles")
    def retire_vehicle(self, request, queryset):
        queryset.update(status='RETIRED')
