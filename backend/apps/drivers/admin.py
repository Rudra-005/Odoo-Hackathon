from django.contrib import admin
from django.utils.html import format_html
from apps.common.admin import BaseModelAdmin
from .models import Driver, DriverLicense

class DriverLicenseInline(admin.TabularInline):
    model = DriverLicense
    extra = 0

@admin.register(Driver)
class DriverAdmin(BaseModelAdmin):
    inlines = [DriverLicenseInline]
    list_display = (
        'photo_thumbnail', 'driver_code', 'first_name', 'last_name', 'phone', 
        'current_availability', 'license_warning', 'status_badge', 'safety_score'
    )
    list_editable = ('safety_score',)
    search_fields = ('first_name', 'last_name', 'phone', 'driver_code')
    list_filter = ('status',)
    
    fieldsets = (
        ('Personal Information', {
            'fields': (
                'company', 'driver_code', 'first_name', 'last_name', 'gender', 'photo', 
                'email', 'phone', 'alt_phone', 'dob', 'blood_group'
            )
        }),
        ('Address', {
            'fields': ('address', 'city', 'state', 'country', 'pincode')
        }),
        ('Employment, Assignments & Safety', {
            'fields': (
                'joining_date', 'experience', 'salary', 'assigned_vehicle',
                'safety_score', 'emergency_contact_name', 'emergency_contact_number'
            )
        }),
        ('Medical Information', {
            'fields': ('medical_certificate_number', 'medical_certificate_expiry')
        }),
        ('Status & Remarks', {
            'fields': ('status', 'remarks')
        })
    )

    actions = ['suspend_driver', 'activate_driver', 'export_as_csv']

    @admin.display(description="Status Badge")
    def status_badge(self, obj):
        return self.get_status_badge(obj.status)
        
    @admin.display(description="Photo")
    def photo_thumbnail(self, obj):
        if obj.photo:
            return format_html('<img src="{}" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover;" />', obj.photo)
        return format_html('<div style="width: 45px; height: 45px; background: #e2e8f0; border-radius: 50%;"></div>')

    @admin.display(description="Availability")
    def current_availability(self, obj):
        if obj.status == 'AVAILABLE':
            return format_html('<span style="color: #22c55e; font-weight: bold;">🟢 Available</span>')
        elif obj.status == 'ON_TRIP':
            return format_html('<span style="color: #3b82f6; font-weight: bold;">🔵 On Trip</span>')
        elif obj.status == 'SUSPENDED':
            return format_html('<span style="color: #ef4444; font-weight: bold;">🔴 Suspended</span>')
        else:
            return format_html('<span style="color: #6b7280; font-weight: bold;">⚪ Off Duty</span>')

    @admin.display(description="License Status")
    def license_warning(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        
        if not hasattr(obj, 'license'):
            return format_html('<span style="color: #ef4444; font-weight: bold;">❌ No License</span>')
            
        expiry = obj.license.license_expiry
        today = timezone.now().date()
        
        if expiry < today:
            return format_html('<span style="color: #ef4444; font-weight: bold; background: #fee2e2; padding: 2px 6px; border-radius: 4px;">⚠️ Expired ({})</span>', expiry)
        elif expiry <= today + timedelta(days=30):
            return format_html('<span style="color: #f97316; font-weight: bold; background: #ffedd5; padding: 2px 6px; border-radius: 4px;">⚠️ Expires Soon ({})</span>', expiry)
            
        return format_html('<span style="color: #22c55e;">✅ Valid</span>')

    @admin.action(description="Suspend selected drivers")
    def suspend_driver(self, request, queryset):
        queryset.update(status='SUSPENDED')

    @admin.action(description="Activate selected drivers")
    def activate_driver(self, request, queryset):
        queryset.update(status='AVAILABLE')
