from django.db import models
from apps.common.models import BaseModel, Company
from apps.vehicles.models import Vehicle
from apps.trips.models import Trip
from apps.drivers.models import Driver

class ExpenseCategory(BaseModel):
    CATEGORY_CHOICES = [
        ('FUEL', 'Fuel'),
        ('MAINTENANCE', 'Maintenance'),
        ('PARKING', 'Parking'),
        ('TOLL', 'Toll'),
        ('INSURANCE', 'Insurance'),
        ('REPAIR', 'Repair'),
        ('SALARY', 'Salary'),
        ('FINE', 'Fine'),
        ('ACCIDENT', 'Accident'),
        ('CLEANING', 'Cleaning'),
        ('PERMIT', 'Permit'),
        ('TAX', 'Tax'),
        ('MISC', 'Miscellaneous'),
    ]
    name = models.CharField(max_length=50, choices=CATEGORY_CHOICES, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "expenses_expense_category"

    def __str__(self):
        return self.get_name_display()


class Expense(BaseModel):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    PAYMENT_METHODS = [
        ('CASH', 'Cash'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('CHEQUE', 'Cheque'),
        ('CREDIT_CARD', 'Credit Card'),
        ('DEBIT_CARD', 'Debit Card'),
        ('UPI', 'UPI'),
        ('COMPANY_WALLET', 'Company Wallet'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="expenses")
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, null=True, blank=True, related_name="expenses")
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, null=True, blank=True, related_name="expenses")
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True, related_name="expenses")
    
    category = models.ForeignKey(ExpenseCategory, on_delete=models.PROTECT, related_name="expenses")
    
    expense_number = models.CharField(max_length=100, unique=True, blank=True, db_index=True)
    
    vendor = models.CharField(max_length=255, blank=True)
    vendor_contact = models.CharField(max_length=100, blank=True)
    invoice_number = models.CharField(max_length=100, blank=True)
    invoice_upload = models.URLField(max_length=1024, blank=True, null=True)
    
    import django.utils.timezone
    expense_date = models.DateField(default=django.utils.timezone.now, db_index=True)
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    net_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHODS, default='BANK_TRANSFER')
    reference_number = models.CharField(max_length=100, blank=True, help_text="Transaction ID or Cheque No")
    
    description = models.TextField(blank=True)
    remarks = models.TextField(blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)

    class Meta:
        db_table = "expenses_expense"
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["expense_date"]),
            models.Index(fields=["vehicle", "expense_date"]),
        ]
        ordering = ['-expense_date', '-created_at']

    def __str__(self):
        return f"{self.expense_number} - {self.category} - {self.net_amount}"
