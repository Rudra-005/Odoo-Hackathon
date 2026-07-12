"""
Trip services — integrates with SchedulingEngine for all state transitions.
Existing API contracts unchanged; scheduling logic added transparently.
"""
from django.db import transaction
from django.utils import timezone
from .models import Trip, TripHistory
from apps.vehicles.models import Vehicle
from apps.drivers.models import Driver
from .validators import validate_trip_data, validate_trip_completion
from .scheduling import SchedulingEngine
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger("transitops.trips")


def _get_real_user(user):
    """Return authenticated user or None for AnonymousUser."""
    if user and hasattr(user, "pk") and user.pk:
        return user
    return None


def _create_trip_history(trip, user, old_status, new_status, notes=""):
    TripHistory.objects.create(
        trip=trip,
        changed_by=user,
        old_status=old_status,
        new_status=new_status,
        notes=notes,
    )


def _generate_trip_number() -> str:
    """Generate unique sequential trip number."""
    last = Trip.objects.order_by("-created_at").values_list("trip_number", flat=True).first()
    if last:
        try:
            num = int(last.split("-")[-1]) + 1
        except (ValueError, IndexError):
            num = 1
    else:
        num = 1
    return f"TRP-{num:04d}"


def create_trip(*, user, data: dict) -> Trip:
    """
    Creates a new Trip in DRAFT status.
    Runs scheduling validation if time fields are provided.
    """
    validate_trip_data(data)

    real_user = _get_real_user(user)

    # Auto-assign company
    if not data.get("company_id") and not data.get("company"):
        if real_user and getattr(real_user, "company_id", None):
            data["company_id"] = real_user.company_id
        else:
            from apps.common.models import Company
            company = Company.objects.first()
            if company:
                data["company"] = company

    data["status"] = "DRAFT"

    with transaction.atomic():
        trip = Trip(
            created_by=real_user,
            updated_by=real_user,
            trip_number=_generate_trip_number(),
            **data,
        )
        trip.full_clean()
        trip.save()
        _create_trip_history(trip, real_user, "NONE", "DRAFT", "Trip created.")

    logger.info("Trip created | trip=%s | vehicle=%s | driver=%s | window=[%s → %s]",
                trip.trip_number, trip.vehicle_id, trip.driver_id,
                trip.planned_start_time, trip.planned_end_time)
    return trip


def update_trip(*, trip: Trip, user, data: dict) -> Trip:
    """
    Updates a trip if it's still in DRAFT.
    Re-runs scheduling validation on edit.
    """
    if trip.status != "DRAFT":
        raise ValidationError(
            {"status": "Only DRAFT trips can be edited directly. Use actions for status changes."}
        )

    validate_trip_data(data, trip_instance=trip)

    real_user = _get_real_user(user)

    with transaction.atomic():
        for field, value in data.items():
            setattr(trip, field, value)

        trip.updated_by = real_user
        trip.full_clean()
        trip.save()

    return trip


def delete_trip(*, trip: Trip, user):
    """Soft deletes a trip."""
    real_user = _get_real_user(user)
    trip.is_deleted = True
    trip.deleted_at = timezone.now()
    trip.updated_by = real_user
    trip.save(update_fields=["is_deleted", "deleted_at", "updated_by"])


def dispatch_trip(*, trip: Trip, user) -> Trip:
    """
    Dispatches a trip through the full enterprise validation chain.
    Updates Vehicle and Driver to ON_TRIP.
    """
    if trip.status != "DRAFT":
        raise ValidationError({"status": "Only DRAFT trips can be dispatched."})

    # Full enterprise dispatch validation (ordered per spec)
    SchedulingEngine.validate_full_dispatch(trip)

    real_user = _get_real_user(user)

    with transaction.atomic():
        # Row-level locks
        vehicle = Vehicle.objects.select_for_update().get(id=trip.vehicle_id)
        driver = Driver.objects.select_for_update().get(id=trip.driver_id)

        # Double-check locks
        if vehicle.status not in ["AVAILABLE"]:
            raise ValidationError({"vehicle": f"Vehicle is {vehicle.status} and cannot be dispatched."})
        if driver.status not in ["AVAILABLE"]:
            raise ValidationError({"driver": f"Driver is {driver.status} and cannot be dispatched."})

        vehicle.status = "ON_TRIP"
        vehicle.updated_by = real_user
        vehicle.save(update_fields=["status", "updated_by"])

        driver.status = "ON_TRIP"
        driver.updated_by = real_user
        driver.save(update_fields=["status", "updated_by"])

        old_status = trip.status
        trip.status = "DISPATCHED"
        trip.dispatch_date = timezone.now()
        trip.actual_start_time = timezone.now()
        trip.updated_by = real_user
        trip.save()

        _create_trip_history(trip, real_user, old_status, "DISPATCHED", "Trip officially dispatched.")

    logger.info("Trip dispatched | trip=%s | vehicle=%s | driver=%s",
                trip.trip_number, vehicle.registration_number, driver.driver_code)
    return trip


def start_trip(*, trip: Trip, user) -> Trip:
    """Marks a dispatched trip as In Progress."""
    if trip.status != "DISPATCHED":
        raise ValidationError({"status": "Only DISPATCHED trips can be started."})

    real_user = _get_real_user(user)

    with transaction.atomic():
        old_status = trip.status
        trip.status = "IN_PROGRESS"
        trip.start_time = timezone.now()
        trip.actual_start_time = trip.actual_start_time or timezone.now()
        trip.updated_by = real_user
        trip.save()
        _create_trip_history(trip, real_user, old_status, "IN_PROGRESS", "Trip execution started.")

    return trip


def complete_trip(*, trip: Trip, user, data: dict) -> Trip:
    """
    Completes a trip. Restores Vehicle/Driver availability.
    Records actual end time.
    """
    if trip.status not in ["DISPATCHED", "IN_PROGRESS"]:
        raise ValidationError({"status": "Trip must be in progress to complete."})

    validate_trip_completion(trip, data)

    real_user = _get_real_user(user)

    with transaction.atomic():
        vehicle = Vehicle.objects.select_for_update().get(id=trip.vehicle_id)
        driver = Driver.objects.select_for_update().get(id=trip.driver_id)

        for field, value in data.items():
            setattr(trip, field, value)

        old_status = trip.status
        trip.status = "COMPLETED"
        trip.completion_date = timezone.now()
        trip.actual_end_time = timezone.now()
        trip.updated_by = real_user
        trip.save()

        # Check if vehicle/driver has another trip starting now before restoring
        next_vehicle_trip = Trip.objects.filter(
            vehicle=vehicle,
            status="DISPATCHED",
            is_deleted=False,
        ).exclude(id=trip.id).exists()

        next_driver_trip = Trip.objects.filter(
            driver=driver,
            status="DISPATCHED",
            is_deleted=False,
        ).exclude(id=trip.id).exists()

        if not next_vehicle_trip:
            vehicle.status = "AVAILABLE"
            if trip.end_odometer:
                vehicle.current_odometer = trip.end_odometer
            vehicle.updated_by = real_user
            vehicle.save()

        if not next_driver_trip:
            driver.status = "AVAILABLE"
            driver.updated_by = real_user
            driver.save()

        _create_trip_history(trip, real_user, old_status, "COMPLETED", "Trip finalized and completed.")

    logger.info("Trip completed | trip=%s | duration=%s",
                trip.trip_number, trip.actual_duration)
    return trip


def cancel_trip(*, trip: Trip, user) -> Trip:
    """
    Cancels a trip. Restores Vehicle/Driver if they were dispatched.
    """
    if trip.status == "COMPLETED":
        raise ValidationError({"status": "Completed trips cannot be cancelled."})

    real_user = _get_real_user(user)

    with transaction.atomic():
        old_status = trip.status
        trip.status = "CANCELLED"
        trip.updated_by = real_user
        trip.save()

        if old_status in ["DISPATCHED", "IN_PROGRESS"]:
            vehicle = Vehicle.objects.select_for_update().get(id=trip.vehicle_id)
            driver = Driver.objects.select_for_update().get(id=trip.driver_id)

            vehicle.status = "AVAILABLE"
            vehicle.updated_by = real_user
            vehicle.save()

            driver.status = "AVAILABLE"
            driver.updated_by = real_user
            driver.save()

        _create_trip_history(trip, real_user, old_status, "CANCELLED", "Trip aborted.")

    logger.info("Trip cancelled | trip=%s | prev_status=%s", trip.trip_number, old_status)
    return trip
