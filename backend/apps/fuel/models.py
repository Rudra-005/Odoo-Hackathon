from django.db import models
from apps.common.models import BaseModel, Company
from apps.vehicles.models import Vehicle
from apps.drivers.models import Driver
from apps.trips.models import Trip

class FuelLog(BaseModel):
    FUEL_TYPES = [
        ('PETROL', 'Petrol'),
        ('DIESEL', 'Diesel'),
        ('CNG', 'CNG'),
        ('ELECTRIC', 'Electric'),
        ('HYBRID', 'Hybrid'),
        ('OTHER', 'Other'),
    ]
    
    PAYMENT_METHODS = [
        ('CASH', 'Cash'),
        ('CARD', 'Card'),
        ('UPI', 'UPI'),
        ('COMPANY_ACCOUNT', 'Company Account'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="fuel_logs")
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="fuel_logs")
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True, related_name="fuel_logs")
    trip = models.ForeignKey(Trip, on_delete=models.SET_NULL, null=True, blank=True, related_name="fuel_logs")
    
    fuel_log_number = models.CharField(max_length=100, unique=True, blank=True, db_index=True)
    
    fuel_station = models.CharField(max_length=255, blank=True)
    fuel_vendor = models.CharField(max_length=255, blank=True)
    fuel_type = models.CharField(max_length=50, choices=FUEL_TYPES, default='DIESEL')
    
    quantity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Liters or KWh")
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2)
    
    odometer_reading = models.DecimalField(max_digits=10, decimal_places=2, help_text="Current Odometer")
    distance_since_last = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    fuel_efficiency = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Km/L or Km/KWh")
    
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHODS, default='CARD')
    invoice_number = models.CharField(max_length=100, blank=True)
    invoice_upload = models.URLField(max_length=1024, blank=True, null=True)
    
    fuel_date = models.DateField(db_index=True)
    remarks = models.TextField(blank=True)

    class Meta:
        db_table = "fuel_fuel_log"
        indexes = [
            models.Index(fields=["vehicle", "fuel_date"]),
        ]
        ordering = ['-fuel_date', '-created_at']

    def __str__(self):
        return f"{self.fuel_log_number} - {self.vehicle.registration_number}"
