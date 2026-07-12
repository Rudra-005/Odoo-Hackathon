from django.db import transaction
from django.utils import timezone
from .models import Vehicle
from .validators import validate_vehicle_data

def _get_real_user(user):
    """Return user if authenticated, else None (for AnonymousUser)."""
    if user and hasattr(user, 'pk') and user.pk:
        return user
    return None

def create_vehicle(*, user, data: dict) -> Vehicle:
    """
    Creates a new Vehicle instance enforcing business logic.
    """
    validate_vehicle_data(data)
    
    # Auto-assign company if not provided
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
    vehicle = Vehicle(created_by=real_user, updated_by=real_user, **data)
    vehicle.full_clean()
    vehicle.save()
    
    return vehicle

def update_vehicle(*, vehicle: Vehicle, user, data: dict) -> Vehicle:
    """
    Updates an existing Vehicle instance enforcing business logic.
    """
    validate_vehicle_data(data)
    
    non_side_effect_fields = [
        'region_id', 'vehicle_type_id', 'registration_number', 'vin_number',
        'vehicle_name', 'model', 'manufacturer', 'year', 'fuel_type',
        'maximum_load_capacity', 'current_odometer', 'acquisition_cost',
        'purchase_date', 'insurance_number', 'insurance_expiry',
        'fitness_expiry', 'status', 'description', 'image'
    ]
    
    real_user = _get_real_user(user)
    for field in non_side_effect_fields:
        if field in data:
            setattr(vehicle, field, data[field])
            
    vehicle.updated_by = real_user
    vehicle.full_clean()
    vehicle.save()
    
    return vehicle

def delete_vehicle(*, vehicle: Vehicle, user):
    """
    Soft deletes a vehicle.
    """
    real_user = _get_real_user(user)
    vehicle.is_deleted = True
    vehicle.deleted_at = timezone.now()
    vehicle.updated_by = real_user
    vehicle.save(update_fields=['is_deleted', 'deleted_at', 'updated_by'])

def bulk_delete_vehicles(*, vehicle_ids: list, user):
    """
    Soft deletes multiple vehicles at once.
    """
    real_user = _get_real_user(user)
    with transaction.atomic():
        vehicles = Vehicle.objects.filter(id__in=vehicle_ids, is_deleted=False)
        for vehicle in vehicles:
            vehicle.is_deleted = True
            vehicle.deleted_at = timezone.now()
            vehicle.updated_by = real_user
        Vehicle.objects.bulk_update(vehicles, ['is_deleted', 'deleted_at', 'updated_by'])

def bulk_update_vehicle_status(*, vehicle_ids: list, status: str, user):
    """
    Updates the status of multiple vehicles.
    """
    real_user = _get_real_user(user)
    with transaction.atomic():
        vehicles = Vehicle.objects.filter(id__in=vehicle_ids, is_deleted=False)
        for vehicle in vehicles:
            vehicle.status = status
            vehicle.updated_by = real_user
        Vehicle.objects.bulk_update(vehicles, ['status', 'updated_by'])

