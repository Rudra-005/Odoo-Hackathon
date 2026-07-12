from django.db import models
from django.utils import timezone
from apps.common.models import BaseModel, Company

class Driver(BaseModel):
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('ON_TRIP', 'On Trip'),
        ('OFF_DUTY', 'Off Duty'),
        ('SUSPENDED', 'Suspended'),
    ]

    BLOOD_GROUP_CHOICES = [
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-'),
    ]

    GENDER_CHOICES = [
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="drivers")
    
    driver_code = models.CharField(max_length=50, unique=True, blank=True, db_index=True)
    first_name = models.CharField(max_length=100, default='')
    last_name = models.CharField(max_length=100, default='')
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, default='MALE')
    
    assigned_vehicle = models.ForeignKey('vehicles.Vehicle', null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_driver_set')
    
    dob = models.DateField(verbose_name="Date of Birth", null=True, blank=True)
    blood_group = models.CharField(max_length=10, choices=BLOOD_GROUP_CHOICES, blank=True)
    
    email = models.EmailField(unique=True, db_index=True, blank=True, null=True)
    phone = models.CharField(max_length=20, unique=True, db_index=True)
    alt_phone = models.CharField(max_length=20, blank=True, null=True)
    
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=20, blank=True)
    
    joining_date = models.DateField(null=True, blank=True)
    experience = models.PositiveIntegerField(help_text="Experience in years", default=0)
    
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_number = models.CharField(max_length=20, blank=True)
    
    medical_certificate_number = models.CharField(max_length=100, blank=True)
    medical_certificate_expiry = models.DateField(null=True, blank=True)
    
    safety_score = models.DecimalField(max_digits=5, decimal_places=2, default=100.00, help_text="Score out of 100")
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    remarks = models.TextField(blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE', db_index=True)
    photo = models.URLField(max_length=1024, blank=True, null=True)

    class Meta:
        db_table = "drivers_driver"
        indexes = [
            models.Index(fields=["status"]),
        ]

    @property
    def driver_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return f"{self.driver_code} - {self.first_name} {self.last_name}"

    # Custom Methods requested by user
    def can_assign(self):
        return self.status == 'AVAILABLE' and self.is_license_valid()
        
    def is_license_valid(self):
        if not hasattr(self, 'license'):
            return False
        return self.license.license_expiry >= timezone.now().date()
        
    def calculate_experience(self):
        # Could dynamically compute from another date, but sticking to the stored field for now
        return self.experience

    def update_status(self, new_status):
        self.status = new_status
        self.save(update_fields=['status', 'updated_at'])

    def current_trip(self):
        # Assuming Trip model has a foreign key to Driver, we can fetch active trip
        return self.trips.filter(status='DISPATCHED').first()


class DriverLicense(BaseModel):
    CATEGORY_CHOICES = [
        ('LMV', 'Light Motor Vehicle'),
        ('HMV', 'Heavy Motor Vehicle'),
        ('TRANSPORT', 'Transport'),
        ('HGMV', 'Heavy Goods Motor Vehicle'),
        ('PASSENGER', 'Passenger'),
        ('OTHER', 'Other'),
    ]

    driver = models.OneToOneField(Driver, on_delete=models.CASCADE, related_name="license")
    license_number = models.CharField(max_length=100, unique=True, db_index=True)
    license_category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    license_issue_date = models.DateField(null=True, blank=True)
    license_expiry = models.DateField()
    license_authority = models.CharField(max_length=255, blank=True)
    document_url = models.URLField(max_length=1024, blank=True, null=True)

    class Meta:
        db_table = "drivers_driver_license"

    def __str__(self):
        return f"License {self.license_number} - {self.driver.driver_name}"
