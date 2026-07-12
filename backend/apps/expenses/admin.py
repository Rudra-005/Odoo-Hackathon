from django.contrib import admin
from apps.common.admin import BaseModelAdmin
from .models import ExpenseCategory, Expense

@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(BaseModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(Expense)
class ExpenseAdmin(BaseModelAdmin):
    list_display = (
        'expense_number', 'category', 'vehicle', 'trip', 
        'vendor', 'net_amount', 'expense_date', 'status_badge', 'status'
    )
    list_filter = ('status', 'category', 'payment_method', 'expense_date')
    search_fields = (
        'expense_number', 'vehicle__registration_number', 
        'trip__trip_number', 'vendor', 'invoice_number'
    )
    date_hierarchy = 'expense_date'
    
    fieldsets = (
        ('Expense Overview', {
            'fields': (
                'expense_number', 'category', 'vehicle', 'trip', 'driver', 'expense_date'
            )
        }),
        ('Vendor Details', {
            'fields': ('vendor', 'vendor_contact', 'invoice_number', 'invoice_upload')
        }),
        ('Financials', {
            'fields': (
                'amount', 'tax', 'discount', 'net_amount'
            )
        }),
        ('Payment', {
            'fields': (
                'payment_method', 'reference_number', 'status'
            )
        }),
        ('Additional Info', {
            'fields': ('description', 'remarks')
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('vehicle', 'trip', 'category', 'driver')

    @admin.display(description="Status")
    def status_badge(self, obj):
        return self.get_status_badge(obj.status)
