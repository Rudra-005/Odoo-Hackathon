from django.core.exceptions import ValidationError
from django.utils import timezone
from dateutil.relativedelta import relativedelta

def validate_driver_data(data):
    """
    Validates business logic for drivers before creation or update.
    """
    errors = {}

    # Age Validation (>= 18)
    if 'dob' in data and data['dob'] is not None:
        age = relativedelta(timezone.now().date(), data['dob']).years
        if age < 18:
            errors['dob'] = "Driver must be at least 18 years old."

    # Joining Date Validation (<= Today)
    if 'joining_date' in data and data['joining_date'] is not None:
        if data['joining_date'] > timezone.now().date():
            errors['joining_date'] = "Joining date cannot be in the future."

    # Safety Score Boundary
    if 'safety_score' in data and data['safety_score'] is not None:
        if data['safety_score'] < 0 or data['safety_score'] > 100:
            errors['safety_score'] = "Safety score must be between 0 and 100."

    if errors:
        raise ValidationError(errors)


def validate_license_data(data):
    """
    Validates business logic for driver licenses.
    """
    errors = {}

    if 'license_issue_date' in data and 'license_expiry' in data:
        if data['license_issue_date'] and data['license_expiry']:
            if data['license_expiry'] <= data['license_issue_date']:
                errors['license_expiry'] = "License expiry date must be strictly after the issue date."

    if errors:
        raise ValidationError(errors)
