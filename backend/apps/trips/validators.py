"""
Trip validators — delegates time/collision checks to SchedulingEngine.
Keeps only non-scheduling business logic here (numeric bounds, etc.).
"""
from django.core.exceptions import ValidationError
from apps.trips.scheduling import SchedulingEngine


def validate_trip_data(data, trip_instance=None):
    """
    Validates business logic for trips before creation or update.
    Time-collision checks are delegated to SchedulingEngine.
    """
    errors = {}

    vehicle = data.get("vehicle") or (trip_instance.vehicle if trip_instance else None)
    driver = data.get("driver") or (trip_instance.driver if trip_instance else None)
    planned_start_time = data.get("planned_start_time") or (
        trip_instance.planned_start_time if trip_instance else None
    )
    planned_end_time = data.get("planned_end_time") or (
        trip_instance.planned_end_time if trip_instance else None
    )
    cargo_weight = data.get("cargo_weight", 0)
    exclude_id = str(trip_instance.id) if trip_instance else None

    # Numeric bounds
    if "planned_distance" in data and data["planned_distance"] < 0:
        errors["planned_distance"] = "Distance cannot be negative."
    if "revenue" in data and data["revenue"] < 0:
        errors["revenue"] = "Revenue cannot be negative."

    if errors:
        raise ValidationError(errors)

    # Scheduling engine handles all time + collision checks
    if planned_start_time or planned_end_time:
        SchedulingEngine.validate_trip_schedule(
            vehicle=vehicle,
            driver=driver,
            planned_start_time=planned_start_time,
            planned_end_time=planned_end_time,
            cargo_weight=cargo_weight,
            exclude_trip_id=exclude_id,
            # Allow past times when editing a completed/cancelled historical record
            allow_past=(
                trip_instance is not None
                and trip_instance.status in ["COMPLETED", "CANCELLED"]
            ),
        )


def validate_trip_completion(trip, data):
    """
    Validates a trip before it is marked completed.
    """
    errors = {}

    start_odo = data.get("start_odometer") or trip.start_odometer
    end_odo = data.get("end_odometer") or trip.end_odometer

    if start_odo is not None and end_odo is not None:
        if end_odo <= start_odo:
            errors["end_odometer"] = "End odometer must be strictly greater than start odometer."

    if data.get("fuel_consumed") is not None and data["fuel_consumed"] < 0:
        errors["fuel_consumed"] = "Fuel consumed cannot be negative."

    if errors:
        raise ValidationError(errors)
