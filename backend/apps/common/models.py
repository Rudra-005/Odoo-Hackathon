import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class BaseModel(models.Model):
    """
    Abstract base model representing the standard database schema structure 
    for the TransitOps platform. Includes UUID primary key, audit timestamps, 
    audit users, and soft-delete capabilities.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Using string reference to avoid circular imports
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="%(app_label)s_%(class)s_created",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="%(app_label)s_%(class)s_updated",
    )
    
    # Soft delete capability
    is_active = models.BooleanField(default=True, db_index=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True


class Company(BaseModel):
    name = models.CharField(max_length=255)
    gst_number = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)

    class Meta:
        verbose_name_plural = "Companies"
        db_table = "common_company"

    def __str__(self):
        return self.name


class Region(BaseModel):
    name = models.CharField(max_length=255, unique=True, db_index=True)
    code = models.CharField(max_length=50, unique=True, blank=True, null=True)

    class Meta:
        db_table = "common_region"

    def __str__(self):
        return self.name


class Settings(BaseModel):
    company = models.OneToOneField(Company, on_delete=models.CASCADE, related_name="settings")
    timezone = models.CharField(max_length=50, default="UTC")
    currency = models.CharField(max_length=10, default="USD")
    language = models.CharField(max_length=20, default="en")
    theme = models.CharField(max_length=20, default="light")
    company_logo = models.URLField(blank=True, null=True)

    class Meta:
        verbose_name_plural = "Settings"
        db_table = "common_settings"

    def __str__(self):
        return f"Settings for {self.company.name}"


class Attachment(BaseModel):
    file_url = models.URLField(max_length=1024)
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    
    class Meta:
        db_table = "common_attachment"

    def __str__(self):
        return self.file_name


class AuditLog(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="audit_logs")
    module = models.CharField(max_length=100, db_index=True)
    action = models.CharField(max_length=100)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    browser = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "common_audit_log"
        indexes = [
            models.Index(fields=["user", "module", "created_at"]),
        ]

    def __str__(self):
        return f"{self.user} - {self.action} on {self.module}"
