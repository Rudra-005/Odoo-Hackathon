from django.db import models
from django.conf import settings
from apps.common.models import BaseModel, Company, Region
from apps.vehicles.models import Vehicle
from apps.drivers.models import Driver

class Trip(BaseModel):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('DISPATCHED', 'Dispatched'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="trips")
    
    trip_number = models.CharField(max_length=100, unique=True, db_index=True)
    
    source = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    intermediate_stops = models.TextField(blank=True, help_text="Comma separated list of stops")
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, related_name="trips")
    
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name="trips")
    driver = models.ForeignKey(Driver, on_delete=models.PROTECT, related_name="trips")
    
    cargo_type = models.CharField(max_length=100)
    cargo_description = models.TextField(blank=True)
    cargo_weight = models.DecimalField(max_digits=10, decimal_places=2, help_text="Weight in KGs", default=0.0)
    
    planned_distance = models.DecimalField(max_digits=10, decimal_places=2, help_text="Distance in KMs", default=0.0)
    actual_distance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    estimated_duration = models.DecimalField(max_digits=6, decimal_places=2, help_text="Duration in Hours", null=True, blank=True)
    actual_duration = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    fuel_consumed = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Fuel in Liters")
    
    start_odometer = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    end_odometer = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    customer_name = models.CharField(max_length=255, blank=True)
    customer_contact = models.CharField(max_length=100, blank=True)
    
    dispatch_date = models.DateTimeField(null=True, blank=True)
    start_time = models.DateTimeField(null=True, blank=True)
    arrival_date = models.DateTimeField(null=True, blank=True)
    completion_date = models.DateTimeField(null=True, blank=True)

    # --- Enterprise Scheduling Fields ---
    # These power the collision detection engine.
    # All times are stored in UTC, displayed in local timezone.
    planned_start_time = models.DateTimeField(
        null=True, blank=True,
        help_text="Planned trip start (UTC). Used for collision detection."
    )
    planned_end_time = models.DateTimeField(
        null=True, blank=True,
        help_text="Planned trip end (UTC). Used for collision detection."
    )
    actual_start_time = models.DateTimeField(
        null=True, blank=True,
        help_text="Actual start time recorded at dispatch."
    )
    actual_end_time = models.DateTimeField(
        null=True, blank=True,
        help_text="Actual end time recorded at completion."
    )

    remarks = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT', db_index=True)

    class Meta:
        db_table = "trips_trip"
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["vehicle", "status"]),
            models.Index(fields=["driver", "status"]),
            # Scheduling engine indexes for fast collision queries
            models.Index(fields=["planned_start_time"]),
            models.Index(fields=["planned_end_time"]),
            models.Index(fields=["vehicle", "planned_start_time", "planned_end_time"]),
            models.Index(fields=["driver", "planned_start_time", "planned_end_time"]),
        ]

    def __str__(self):
        return f"Trip {self.trip_number} - {self.source} to {self.destination}"


class TripHistory(BaseModel):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="history")
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="trip_history_changes"
    )
    
    old_status = models.CharField(max_length=50)
    new_status = models.CharField(max_length=50)
    
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "trips_trip_history"

    def __str__(self):
        return f"{self.trip.trip_number} Status changed to {self.new_status}"
