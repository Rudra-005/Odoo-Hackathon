from django.db import transaction
from django.utils import timezone
from .models import Driver, DriverLicense
from .validators import validate_driver_data, validate_license_data

def _get_real_user(user):
    """Return user if authenticated, else None (for AnonymousUser)."""
    if user and hasattr(user, 'pk') and user.pk:
        return user
    return None

def create_driver(*, user, data: dict) -> Driver:
    """
    Creates a new Driver instance along with their License enforcing business logic.
    """
    license_data = data.pop('license', None)
    
    validate_driver_data(data)
    if license_data:
        validate_license_data(license_data)
    
    # Auto-assign company
    if not data.get('company_id') and not data.get('company'):
        real_user = _get_real_user(user)
        if real_user and getattr(real_user, 'company_id', None):
            data['company_id'] = real_user.company_id
        else:
            from apps.common.models import Company
            company = Company.objects.first()
            if company:
                data['company'] = company

    real_user = _get_real_user(user)
        
    with transaction.atomic():
        driver = Driver(created_by=real_user, updated_by=real_user, **data)
        driver.full_clean()
        driver.save()
        
        if license_data:
            DriverLicense.objects.create(
                driver=driver,
                created_by=real_user,
                updated_by=real_user,
                **license_data
            )
            
    return driver

def update_driver(*, driver: Driver, user, data: dict) -> Driver:
    """
    Updates an existing Driver instance enforcing business logic.
    """
    license_data = data.pop('license', None)
    
    validate_driver_data(data)
    
    non_side_effect_fields = [
        'first_name', 'last_name', 'gender', 'dob', 'blood_group', 
        'email', 'phone', 'alt_phone', 'address', 'city', 'state', 
        'country', 'pincode', 'joining_date', 'experience', 
        'emergency_contact_name', 'emergency_contact_number', 
        'medical_certificate_number', 'medical_certificate_expiry', 
        'safety_score', 'salary', 'remarks', 'status', 'photo',
        'assigned_vehicle',
    ]
    
    real_user = _get_real_user(user)
    
    with transaction.atomic():
        for field in non_side_effect_fields:
            if field in data:
                setattr(driver, field, data[field])
                
        driver.updated_by = real_user
        driver.full_clean()
        driver.save()
        
        if license_data:
            validate_license_data(license_data)
            license_instance = getattr(driver, 'license', None)
            if license_instance:
                for k, v in license_data.items():
                    setattr(license_instance, k, v)
                license_instance.updated_by = real_user
                license_instance.save()
            else:
                DriverLicense.objects.create(
                    driver=driver,
                    created_by=real_user,
                    updated_by=real_user,
                    **license_data
                )
                
    return driver

def delete_driver(*, driver: Driver, user):
    """
    Soft deletes a driver.
    """
    real_user = _get_real_user(user)
    driver.is_deleted = True
    driver.deleted_at = timezone.now()
    driver.updated_by = real_user
    driver.save(update_fields=['is_deleted', 'deleted_at', 'updated_by'])

def bulk_delete_drivers(*, driver_ids: list, user):
    """
    Soft deletes multiple drivers at once.
    """
    real_user = _get_real_user(user)
    with transaction.atomic():
        drivers = Driver.objects.filter(id__in=driver_ids, is_deleted=False)
        for driver in drivers:
            driver.is_deleted = True
            driver.deleted_at = timezone.now()
            driver.updated_by = real_user
        Driver.objects.bulk_update(drivers, ['is_deleted', 'deleted_at', 'updated_by'])

def bulk_update_driver_status(*, driver_ids: list, status: str, user):
    """
    Updates the status of multiple drivers.
    """
    real_user = _get_real_user(user)
    with transaction.atomic():
        drivers = Driver.objects.filter(id__in=driver_ids, is_deleted=False)
        for driver in drivers:
            driver.status = status
            driver.updated_by = real_user
        Driver.objects.bulk_update(drivers, ['status', 'updated_by'])

