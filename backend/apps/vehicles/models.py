from django.db import models
from apps.common.models import BaseModel, Company, Region

class VehicleType(BaseModel):
    TYPE_CHOICES = [
        ('TRUCK', 'Truck'),
        ('MINI_TRUCK', 'Mini Truck'),
        ('PICKUP', 'Pickup'),
        ('VAN', 'Van'),
        ('BUS', 'Bus'),
        ('TRAILER', 'Trailer'),
        ('OTHER', 'Other'),
    ]
    name = models.CharField(max_length=50, choices=TYPE_CHOICES, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "vehicles_vehicle_type"

    def __str__(self):
        return self.get_name_display()


class Vehicle(BaseModel):
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('ON_TRIP', 'On Trip'),
        ('MAINTENANCE', 'Maintenance'),
        ('RETIRED', 'Retired'),
    ]

    FUEL_TYPE_CHOICES = [
        ('DIESEL', 'Diesel'),
        ('PETROL', 'Petrol'),
        ('ELECTRIC', 'Electric'),
        ('CNG', 'CNG'),
        ('HYBRID', 'Hybrid'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="vehicles")
    region = models.ForeignKey(Region, on_delete=models.PROTECT, related_name="vehicles")
    vehicle_type = models.ForeignKey(VehicleType, on_delete=models.PROTECT, related_name="vehicles")
    
    registration_number = models.CharField(max_length=100, unique=True, db_index=True)
    vin_number = models.CharField(max_length=100, unique=True, db_index=True)
    
    vehicle_name = models.CharField(max_length=255)
    model = models.CharField(max_length=100)
    manufacturer = models.CharField(max_length=100)
    year = models.PositiveIntegerField()
    
    maximum_load_capacity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Capacity in KGs")
    current_odometer = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    fuel_type = models.CharField(max_length=20, choices=FUEL_TYPE_CHOICES)
    acquisition_cost = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    
    insurance_number = models.CharField(max_length=100, blank=True)
    insurance_expiry = models.DateField(null=True, blank=True)
    fitness_expiry = models.DateField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE', db_index=True)
    image = models.URLField(max_length=1024, blank=True, null=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "vehicles_vehicle"
        indexes = [
            models.Index(fields=["status", "region"]),
        ]

    def __str__(self):
        return f"{self.registration_number} ({self.vehicle_name})"


class VehicleDocument(BaseModel):
    DOC_TYPES = [
        ('REGISTRATION', 'Registration Certificate'),
        ('INSURANCE', 'Insurance'),
        ('FITNESS', 'Fitness'),
        ('PERMIT', 'Permit'),
        ('POLLUTION', 'Pollution Certificate'),
        ('INVOICE', 'Invoice'),
        ('OTHER', 'Other'),
    ]

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="documents")
    document_type = models.CharField(max_length=20, choices=DOC_TYPES)
    image_url = models.URLField(max_length=1024)
    expiry_date = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = "vehicles_vehicle_document"

    def __str__(self):
        return f"{self.get_document_type_display()} - {self.vehicle.registration_number}"
