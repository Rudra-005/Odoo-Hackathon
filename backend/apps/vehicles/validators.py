from django.core.exceptions import ValidationError
from django.utils import timezone

def validate_vehicle_data(data):
    """
    Validates business logic for vehicles before creation or update.
    """
    errors = {}

    # Capacity validation
    if 'maximum_load_capacity' in data and data['maximum_load_capacity'] is not None:
        if data['maximum_load_capacity'] <= 0:
            errors['maximum_load_capacity'] = "Capacity must be greater than 0."

    # Odometer validation
    if 'current_odometer' in data and data['current_odometer'] is not None:
        if data['current_odometer'] < 0:
            errors['current_odometer'] = "Odometer reading cannot be negative."

    # Purchase Date Validation
    if 'purchase_date' in data and data['purchase_date'] is not None:
        if data['purchase_date'] > timezone.now().date():
            errors['purchase_date'] = "Purchase date cannot be in the future."

    # Insurance Expiry Validation
    if 'insurance_expiry' in data and 'purchase_date' in data:
        if data['insurance_expiry'] and data['purchase_date']:
            if data['insurance_expiry'] <= data['purchase_date']:
                errors['insurance_expiry'] = "Insurance expiry must be after the purchase date."

    if errors:
        raise ValidationError(errors)
