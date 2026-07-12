from django.db import models
from apps.common.models import BaseModel, Company
from apps.vehicles.models import Vehicle

class MaintenanceType(BaseModel):
    TYPE_CHOICES = [
        ('OIL_CHANGE', 'Oil Change'),
        ('TYRE_REPLACEMENT', 'Tyre Replacement'),
        ('BRAKE_SERVICE', 'Brake Service'),
        ('ENGINE_REPAIR', 'Engine Repair'),
        ('BATTERY_REPLACEMENT', 'Battery Replacement'),
        ('CLUTCH', 'Clutch'),
        ('GEARBOX', 'Gearbox'),
        ('SUSPENSION', 'Suspension'),
        ('AC_SERVICE', 'AC Service'),
        ('ELECTRICAL', 'Electrical'),
        ('GENERAL_SERVICE', 'General Service'),
        ('ACCIDENT_REPAIR', 'Accident Repair'),
        ('OTHER', 'Other'),
    ]
    name = models.CharField(max_length=50, choices=TYPE_CHOICES, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "maintenance_maintenance_type"

    def __str__(self):
        return self.get_name_display()


class MaintenanceLog(BaseModel):
    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="maintenance_logs")
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="maintenance_logs")
    maintenance_type = models.ForeignKey(MaintenanceType, on_delete=models.PROTECT, related_name="logs")
    
    maintenance_id = models.CharField(max_length=100, unique=True, blank=True, db_index=True)
    
    workshop = models.CharField(max_length=255, blank=True)
    vendor = models.CharField(max_length=255, blank=True)
    mechanic_name = models.CharField(max_length=255, blank=True)
    mechanic_contact = models.CharField(max_length=50, blank=True)
    
    issue = models.CharField(max_length=255)
    diagnosis = models.TextField(blank=True)
    description = models.TextField(blank=True)
    
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    
    estimated_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    actual_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    start_date = models.DateField(null=True, blank=True)
    estimated_completion = models.DateField(null=True, blank=True)
    actual_completion = models.DateField(null=True, blank=True)

    # --- Scheduling precision window (used by collision engine) ---
    # DateTimeFields allow hour-level conflict detection vs DateFields.
    maintenance_start = models.DateTimeField(
        null=True, blank=True,
        help_text="Exact datetime the vehicle enters the workshop (UTC)."
    )
    maintenance_end = models.DateTimeField(
        null=True, blank=True,
        help_text="Exact datetime the vehicle is expected back (UTC)."
    )

    invoice_number = models.CharField(max_length=100, blank=True)
    invoice_upload = models.URLField(max_length=1024, blank=True, null=True)
    
    parts_used = models.TextField(blank=True, help_text="List of parts used")
    warranty = models.CharField(max_length=255, blank=True, help_text="Warranty details")
    remarks = models.TextField(blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED', db_index=True)

    class Meta:
        db_table = "maintenance_maintenance_log"
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["vehicle", "status"]),
            # Scheduling engine indexes
            models.Index(fields=["vehicle", "maintenance_start", "maintenance_end"]),
        ]

    def __str__(self):
        return f"MNT-{self.maintenance_id} - {self.vehicle.registration_number}"
