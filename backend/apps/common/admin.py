import csv
from django.contrib import admin
from django.http import HttpResponse
from django.utils.html import format_html
from .models import Company, Region, Settings, Attachment, AuditLog

class ExportCsvMixin:
    """Action to export standard CSV format."""
    def export_as_csv(self, request, queryset):
        meta = self.model._meta
        field_names = [field.name for field in meta.fields]

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename={meta.model_name}_export.csv'
        
        writer = csv.writer(response)
        writer.writerow(field_names)
        for obj in queryset:
            row = writer.writerow([getattr(obj, field) for field in field_names])
        return response
    export_as_csv.short_description = "Export Selected to CSV"

class BaseModelAdmin(admin.ModelAdmin, ExportCsvMixin):
    """
    Base Admin providing standard ERP capabilities.
    Inherited by all custom models.
    """
    readonly_fields = ('id', 'created_at', 'updated_at', 'created_by', 'updated_by')
    actions = ['export_as_csv']
    list_per_page = 25
    
    def get_status_badge(self, status):
        colors = {
            'AVAILABLE': 'green',
            'ON_TRIP': 'blue',
            'MAINTENANCE': 'orange',
            'IN_SHOP': 'orange',
            'SUSPENDED': 'red',
            'RETIRED': 'gray',
            'OFF_DUTY': 'gray',
            'DRAFT': 'gray',
            'DISPATCHED': 'blue',
            'COMPLETED': 'green',
            'CANCELLED': 'red',
            'ACTIVE': 'green'
        }
        color = colors.get(str(status).upper(), 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 8px; border-radius: 12px; font-weight: bold; font-size: 11px;">{}</span>',
            color, str(status).replace('_', ' ').title()
        )

@admin.register(Company)
class CompanyAdmin(BaseModelAdmin):
    list_display = ('name', 'gst_number', 'phone', 'email')
    search_fields = ('name', 'gst_number')

@admin.register(Region)
class RegionAdmin(BaseModelAdmin):
    list_display = ('name', 'code')
    search_fields = ('name', 'code')
