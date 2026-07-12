"""
Enterprise Trip Scheduling & Time Collision Management Engine
=============================================================
Central scheduling authority for TransitOps. All conflict detection
goes through this module — never duplicated elsewhere.

Design:
  - Pure ORM queries (exists/filter/exclude) — no Python loops over trips
  - All times stored and compared in UTC via Django timezone utilities
  - Raises ValidationError with specific error codes for each conflict type
  - exclude_trip_id allows editing without self-collision
"""
from __future__ import annotations

import logging
from typing import Optional
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.utils import timezone

logger = logging.getLogger("transitops.scheduling")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _overlap_q(start_field: str, end_field: str, new_start, new_end) -> Q:
    """
    Returns a Q object for the standard overlap condition:
        existing_start < new_end  AND  existing_end > new_start
    Works for both trip-trip and trip-maintenance collisions.
    """
    return Q(**{f"{start_field}__lt": new_end}) & Q(**{f"{end_field}__gt": new_start})


# ---------------------------------------------------------------------------
# SchedulingEngine
# ---------------------------------------------------------------------------

class SchedulingEngine:
    """
    Single source of truth for all scheduling validations.

    Usage:
        SchedulingEngine.validate_trip_schedule(
            vehicle=vehicle,
            driver=driver,
            planned_start_time=dt_start,
            planned_end_time=dt_end,
            cargo_weight=Decimal("1500"),
            exclude_trip_id=trip.id,   # Pass when editing
        )

        SchedulingEngine.validate_full_dispatch(trip)
    """

    # ------------------------------------------------------------------
    # 1. Time sanity
    # ------------------------------------------------------------------

    @staticmethod
    def check_trip_timing(planned_start_time, planned_end_time) -> None:
        """Ensure end > start."""
        if planned_end_time and planned_start_time:
            if planned_end_time <= planned_start_time:
                raise ValidationError(
                    {"planned_end_time": "End time must be after start time."}
                )

    @staticmethod
    def check_past_date(planned_start_time) -> None:
        """Reject booking in the past (except historical edits)."""
        if planned_start_time and planned_start_time < timezone.now():
            raise ValidationError(
                {"planned_start_time": "Planned start time cannot be in the past."}
            )

    # ------------------------------------------------------------------
    # 2. Vehicle collision
    # ------------------------------------------------------------------

    @staticmethod
    def check_vehicle_collision(vehicle, planned_start_time, planned_end_time,
                                 exclude_trip_id: Optional[str] = None) -> None:
        """
        Reject if the vehicle already has an overlapping scheduled trip.

        Overlap condition:  existing_start < new_end  AND  existing_end > new_start
        """
        if not (planned_start_time and planned_end_time):
            return  # No times provided — no collision possible

        from apps.trips.models import Trip

        qs = Trip.objects.filter(
            vehicle=vehicle,
            is_deleted=False,
            status__in=["DRAFT", "DISPATCHED", "IN_PROGRESS"],
        ).filter(
            _overlap_q("planned_start_time", "planned_end_time",
                       planned_start_time, planned_end_time)
        )

        if exclude_trip_id:
            qs = qs.exclude(id=exclude_trip_id)

        if qs.exists():
            conflicting = qs.values("trip_number", "planned_start_time", "planned_end_time").first()
            logger.warning(
                "Vehicle collision detected | vehicle=%s | new_window=[%s, %s] | "
                "conflicts_with=%s [%s → %s]",
                vehicle.registration_number,
                planned_start_time, planned_end_time,
                conflicting["trip_number"],
                conflicting["planned_start_time"],
                conflicting["planned_end_time"],
            )
            raise ValidationError(
                {"vehicle": "Vehicle is already booked during this time."}
            )

    # ------------------------------------------------------------------
    # 3. Driver collision
    # ------------------------------------------------------------------

    @staticmethod
    def check_driver_collision(driver, planned_start_time, planned_end_time,
                                exclude_trip_id: Optional[str] = None) -> None:
        """
        Reject if the driver already has an overlapping scheduled trip.
        """
        if not (planned_start_time and planned_end_time):
            return

        from apps.trips.models import Trip

        qs = Trip.objects.filter(
            driver=driver,
            is_deleted=False,
            status__in=["DRAFT", "DISPATCHED", "IN_PROGRESS"],
        ).filter(
            _overlap_q("planned_start_time", "planned_end_time",
                       planned_start_time, planned_end_time)
        )

        if exclude_trip_id:
            qs = qs.exclude(id=exclude_trip_id)

        if qs.exists():
            conflicting = qs.values("trip_number", "planned_start_time", "planned_end_time").first()
            logger.warning(
                "Driver collision detected | driver=%s | new_window=[%s, %s] | "
                "conflicts_with=%s [%s → %s]",
                driver.driver_code,
                planned_start_time, planned_end_time,
                conflicting["trip_number"],
                conflicting["planned_start_time"],
                conflicting["planned_end_time"],
            )
            raise ValidationError(
                {"driver": "Driver is already assigned to another trip during this time."}
            )

    # ------------------------------------------------------------------
    # 4. Maintenance collision
    # ------------------------------------------------------------------

    @staticmethod
    def check_maintenance_collision(vehicle, planned_start_time, planned_end_time) -> None:
        """
        Reject if the vehicle is in maintenance during the trip window.
        Uses maintenance_start/maintenance_end for precision.
        Falls back to start_date/estimated_completion (date-level) if datetime fields absent.
        """
        if not (planned_start_time and planned_end_time):
            return

        from apps.maintenance.models import MaintenanceLog

        # Primary check: use datetime-precise window
        qs_datetime = MaintenanceLog.objects.filter(
            vehicle=vehicle,
            is_deleted=False,
            status__in=["SCHEDULED", "ACTIVE"],
            maintenance_start__isnull=False,
            maintenance_end__isnull=False,
        ).filter(
            _overlap_q("maintenance_start", "maintenance_end",
                       planned_start_time, planned_end_time)
        )

        if qs_datetime.exists():
            maint = qs_datetime.values("maintenance_id", "maintenance_start", "maintenance_end").first()
            logger.warning(
                "Maintenance collision (datetime) | vehicle=%s | trip_window=[%s, %s] | "
                "maintenance=%s [%s → %s]",
                vehicle.registration_number,
                planned_start_time, planned_end_time,
                maint["maintenance_id"],
                maint["maintenance_start"],
                maint["maintenance_end"],
            )
            raise ValidationError(
                {"vehicle": "Vehicle is currently under maintenance and unavailable during this time."}
            )

        # Fallback: date-level check when datetime fields not populated
        trip_start_date = planned_start_time.date()
        trip_end_date = planned_end_time.date()

        qs_date = MaintenanceLog.objects.filter(
            vehicle=vehicle,
            is_deleted=False,
            status__in=["SCHEDULED", "ACTIVE"],
            maintenance_start__isnull=True,  # Only fallback when datetime not set
        ).filter(
            Q(start_date__lte=trip_end_date) & Q(estimated_completion__gte=trip_start_date)
        )

        if qs_date.exists():
            maint = qs_date.values("maintenance_id", "start_date", "estimated_completion").first()
            logger.warning(
                "Maintenance collision (date fallback) | vehicle=%s | trip_dates=[%s, %s] | "
                "maintenance=%s [%s → %s]",
                vehicle.registration_number,
                trip_start_date, trip_end_date,
                maint["maintenance_id"],
                maint["start_date"],
                maint["estimated_completion"],
            )
            raise ValidationError(
                {"vehicle": "Vehicle is currently under maintenance and unavailable during this time."}
            )

    # ------------------------------------------------------------------
    # 5. License validity
    # ------------------------------------------------------------------

    @staticmethod
    def check_license_validity(driver) -> None:
        """Reject if driver's license is expired."""
        if not driver.is_license_valid():
            logger.warning("License expired | driver=%s", driver.driver_code)
            raise ValidationError(
                {"driver": "Driver license has expired."}
            )

    # ------------------------------------------------------------------
    # 6. Cargo capacity
    # ------------------------------------------------------------------

    @staticmethod
    def check_cargo_capacity(vehicle, cargo_weight) -> None:
        """Reject if cargo exceeds vehicle's maximum load capacity."""
        if cargo_weight and vehicle.maximum_load_capacity:
            if cargo_weight > vehicle.maximum_load_capacity:
                logger.warning(
                    "Cargo capacity exceeded | vehicle=%s | cargo=%s | capacity=%s",
                    vehicle.registration_number, cargo_weight, vehicle.maximum_load_capacity,
                )
                raise ValidationError(
                    {"cargo_weight": f"Cargo exceeds vehicle capacity of {vehicle.maximum_load_capacity} KG."}
                )

    # ------------------------------------------------------------------
    # 7. Vehicle status check (immediate status, not time-based)
    # ------------------------------------------------------------------

    @staticmethod
    def check_vehicle_status(vehicle) -> None:
        """Reject vehicle if it's not available for dispatch."""
        if vehicle.status == "MAINTENANCE":
            raise ValidationError(
                {"vehicle": "Vehicle is currently in maintenance and cannot be dispatched."}
            )
        if vehicle.status == "ON_TRIP":
            raise ValidationError(
                {"vehicle": "Vehicle is already on an active trip."}
            )
        if vehicle.status == "RETIRED":
            raise ValidationError(
                {"vehicle": "Vehicle is retired and cannot be dispatched."}
            )

    @staticmethod
    def check_driver_status(driver) -> None:
        """Reject driver if not available."""
        if driver.status == "ON_TRIP":
            raise ValidationError(
                {"driver": "Driver is already on an active trip."}
            )
        if driver.status == "SUSPENDED":
            raise ValidationError(
                {"driver": "Driver is suspended and cannot be assigned."}
            )

    # ------------------------------------------------------------------
    # 8. Full trip schedule validation (used on create/edit)
    # ------------------------------------------------------------------

    @staticmethod
    def validate_trip_schedule(
        vehicle,
        driver,
        planned_start_time,
        planned_end_time,
        cargo_weight=None,
        exclude_trip_id: Optional[str] = None,
        allow_past: bool = False,
    ) -> None:
        """
        Full scheduling validation for trip creation and editing.
        Runs all time-based checks in order.
        """
        # 1. Time sanity
        SchedulingEngine.check_trip_timing(planned_start_time, planned_end_time)

        # 2. Past date (skip for historical editing)
        if not allow_past:
            SchedulingEngine.check_past_date(planned_start_time)

        # 3. License validity
        if driver:
            SchedulingEngine.check_license_validity(driver)

        # 4. Cargo capacity
        if vehicle and cargo_weight is not None:
            SchedulingEngine.check_cargo_capacity(vehicle, cargo_weight)

        # 5. Vehicle collision
        if vehicle:
            SchedulingEngine.check_vehicle_collision(
                vehicle, planned_start_time, planned_end_time, exclude_trip_id
            )

        # 6. Driver collision
        if driver:
            SchedulingEngine.check_driver_collision(
                driver, planned_start_time, planned_end_time, exclude_trip_id
            )

        # 7. Maintenance collision
        if vehicle:
            SchedulingEngine.check_maintenance_collision(
                vehicle, planned_start_time, planned_end_time
            )

    # ------------------------------------------------------------------
    # 9. Full dispatch validation (ordered exactly per spec)
    # ------------------------------------------------------------------

    @staticmethod
    def validate_full_dispatch(trip) -> None:
        """
        Runs the complete dispatch validation chain in enterprise order:
        Driver Status → Vehicle Status → License → Capacity →
        Trip Timing → Vehicle Collision → Driver Collision → Maintenance Collision
        """
        vehicle = trip.vehicle
        driver = trip.driver

        # 1. Driver status
        SchedulingEngine.check_driver_status(driver)

        # 2. Vehicle status
        SchedulingEngine.check_vehicle_status(vehicle)

        # 3. License validity
        SchedulingEngine.check_license_validity(driver)

        # 4. Cargo capacity
        SchedulingEngine.check_cargo_capacity(vehicle, trip.cargo_weight)

        # 5–7. Time-based checks (only if trip has scheduling times)
        if trip.planned_start_time and trip.planned_end_time:
            SchedulingEngine.check_trip_timing(trip.planned_start_time, trip.planned_end_time)
            SchedulingEngine.check_vehicle_collision(
                vehicle, trip.planned_start_time, trip.planned_end_time, exclude_trip_id=trip.id
            )
            SchedulingEngine.check_driver_collision(
                driver, trip.planned_start_time, trip.planned_end_time, exclude_trip_id=trip.id
            )
            SchedulingEngine.check_maintenance_collision(
                vehicle, trip.planned_start_time, trip.planned_end_time
            )

    # ------------------------------------------------------------------
    # 10. Availability queries (used by frontend dropdowns)
    # ------------------------------------------------------------------

    @staticmethod
    def get_available_vehicles(planned_start_time, planned_end_time, exclude_trip_id: Optional[str] = None):
        """
        Returns QuerySet of vehicles available for a given time window.
        Excludes: ON_TRIP, MAINTENANCE, RETIRED, or with conflicting trips/maintenance.
        """
        from apps.vehicles.models import Vehicle
        from apps.trips.models import Trip
        from apps.maintenance.models import MaintenanceLog

        # Vehicles blocked by active trips
        trip_qs = Trip.objects.filter(
            is_deleted=False,
            status__in=["DRAFT", "DISPATCHED", "IN_PROGRESS"],
        )
        if exclude_trip_id:
            trip_qs = trip_qs.exclude(id=exclude_trip_id)

        blocked_by_trip = trip_qs.filter(
            _overlap_q("planned_start_time", "planned_end_time",
                       planned_start_time, planned_end_time)
        ).values_list("vehicle_id", flat=True)

        # Vehicles blocked by maintenance (datetime window)
        blocked_by_maint_dt = MaintenanceLog.objects.filter(
            is_deleted=False,
            status__in=["SCHEDULED", "ACTIVE"],
            maintenance_start__isnull=False,
        ).filter(
            _overlap_q("maintenance_start", "maintenance_end",
                       planned_start_time, planned_end_time)
        ).values_list("vehicle_id", flat=True)

        # Allow the currently assigned vehicle if editing
        exclude_vehicle_ids = []
        if exclude_trip_id:
            curr_trip = Trip.objects.filter(id=exclude_trip_id).first()
            if curr_trip:
                exclude_vehicle_ids.append(curr_trip.vehicle_id)

        qs = Vehicle.objects.filter(
            is_deleted=False,
        ).filter(
            Q(status="AVAILABLE") | Q(id__in=exclude_vehicle_ids)
        ).exclude(
            id__in=[vid for vid in list(blocked_by_trip) + list(blocked_by_maint_dt) if vid not in exclude_vehicle_ids]
        ).select_related("vehicle_type", "region")
        return qs

    @staticmethod
    def get_available_drivers(planned_start_time, planned_end_time, exclude_trip_id: Optional[str] = None):
        """
        Returns QuerySet of drivers available for a given time window.
        Excludes: ON_TRIP, SUSPENDED, or with conflicting trips.
        """
        from apps.drivers.models import Driver
        from apps.trips.models import Trip

        trip_qs = Trip.objects.filter(
            is_deleted=False,
            status__in=["DRAFT", "DISPATCHED", "IN_PROGRESS"],
        )
        if exclude_trip_id:
            trip_qs = trip_qs.exclude(id=exclude_trip_id)

        blocked_by_trip = trip_qs.filter(
            _overlap_q("planned_start_time", "planned_end_time",
                       planned_start_time, planned_end_time)
        ).values_list("driver_id", flat=True)

        # Allow the currently assigned driver if editing
        exclude_driver_ids = []
        if exclude_trip_id:
            curr_trip = Trip.objects.filter(id=exclude_trip_id).first()
            if curr_trip:
                exclude_driver_ids.append(curr_trip.driver_id)

        qs = Driver.objects.filter(
            is_deleted=False,
        ).filter(
            Q(status="AVAILABLE") | Q(id__in=exclude_driver_ids)
        ).exclude(
            id__in=[did for did in list(blocked_by_trip) if did not in exclude_driver_ids]
        ).select_related()
        return qs

    # ------------------------------------------------------------------
    # 11. Maintenance-trip conflict check (used when scheduling maintenance)
    # ------------------------------------------------------------------

    @staticmethod
    def check_maintenance_trip_conflict(vehicle, maintenance_start, maintenance_end) -> None:
        """
        When scheduling maintenance, reject if there are active trips
        during that maintenance window.
        """
        if not (maintenance_start and maintenance_end):
            return

        from apps.trips.models import Trip

        qs = Trip.objects.filter(
            vehicle=vehicle,
            is_deleted=False,
            status__in=["DRAFT", "DISPATCHED", "IN_PROGRESS"],
        ).filter(
            _overlap_q("planned_start_time", "planned_end_time",
                       maintenance_start, maintenance_end)
        )

        if qs.exists():
            conflicting = qs.values("trip_number", "planned_start_time", "planned_end_time").first()
            raise ValidationError(
                {
                    "maintenance_start": (
                        f"Vehicle has a scheduled trip ({conflicting['trip_number']}) "
                        f"during this maintenance window "
                        f"[{conflicting['planned_start_time']} → {conflicting['planned_end_time']}]."
                    )
                }
            )
