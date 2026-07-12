from django.contrib import admin
from apps.common.admin import BaseModelAdmin
from .models import FuelLog

@admin.register(FuelLog)
class FuelLogAdmin(BaseModelAdmin):
    list_display = (
        'fuel_log_number', 'vehicle', 'driver', 'fuel_date', 
        'quantity', 'total_cost', 'fuel_efficiency'
    )
    list_filter = ('fuel_date', 'fuel_type', 'payment_method')
    search_fields = (
        'fuel_log_number', 'vehicle__registration_number', 
        'driver__driver_code', 'fuel_vendor'
    )
    
    fieldsets = (
        ('Log Information', {
            'fields': (
                'fuel_log_number', 'vehicle', 'trip', 'driver', 'fuel_date'
            )
        }),
        ('Fuel & Vendor', {
            'fields': ('fuel_type', 'fuel_station', 'fuel_vendor')
        }),
        ('Cost & Quantity', {
            'fields': (
                'quantity', 'price_per_unit', 'total_cost', 'payment_method',
                'invoice_number', 'invoice_upload'
            )
        }),
        ('Efficiency Analytics', {
            'fields': (
                'odometer_reading', 'distance_since_last', 'fuel_efficiency'
            )
        }),
        ('Additional Info', {
            'fields': ('remarks',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('vehicle', 'driver', 'trip')
