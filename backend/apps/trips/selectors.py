"""
Trip selectors — added schedule views and availability queries.
All existing selectors unchanged.
"""
from django.db.models import QuerySet, Q
from django.utils import timezone
from datetime import timedelta
from .models import Trip


def get_trips(*, filters=None) -> QuerySet[Trip]:
    """
    Returns a queryset of Trips with applied filters and N+1 optimizations.
    """
    qs = Trip.objects.filter(is_deleted=False).select_related(
        "company", "vehicle", "driver", "region"
    )

    if filters:
        if "status" in filters and filters["status"]:
            qs = qs.filter(status=filters["status"])
        if "vehicle" in filters and filters["vehicle"]:
            qs = qs.filter(vehicle_id=filters["vehicle"])
        if "driver" in filters and filters["driver"]:
            qs = qs.filter(driver_id=filters["driver"])
        if "region" in filters and filters["region"]:
            qs = qs.filter(region_id=filters["region"])
        if "customer_name" in filters and filters["customer_name"]:
            qs = qs.filter(customer_name__icontains=filters["customer_name"])
        if "search" in filters and filters["search"]:
            search_query = filters["search"]
            qs = qs.filter(
                Q(trip_number__icontains=search_query)
                | Q(source__icontains=search_query)
                | Q(destination__icontains=search_query)
                | Q(customer_name__icontains=search_query)
                | Q(vehicle__registration_number__icontains=search_query)
                | Q(driver__first_name__icontains=search_query)
                | Q(driver__last_name__icontains=search_query)
            )
        if "ordering" in filters and filters["ordering"]:
            qs = qs.order_by(filters["ordering"])
        else:
            qs = qs.order_by("-created_at")

    return qs


def get_trip_detail(trip_id: str) -> Trip:
    """Returns a single Trip instance optimized for detail view."""
    return Trip.objects.select_related("company", "vehicle", "driver", "region").get(
        id=trip_id, is_deleted=False
    )


# ---------------------------------------------------------------------------
# Scheduling selectors
# ---------------------------------------------------------------------------

def get_todays_trips() -> QuerySet[Trip]:
    """All trips scheduled or active today."""
    today = timezone.now().date()
    return (
        Trip.objects.filter(is_deleted=False)
        .filter(
            Q(planned_start_time__date=today)
            | Q(planned_end_time__date=today)
            | Q(status__in=["DISPATCHED", "IN_PROGRESS"])
        )
        .select_related("vehicle", "driver")
        .order_by("planned_start_time")
    )


def get_upcoming_trips(days: int = 7) -> QuerySet[Trip]:
    """Trips scheduled to start in the next N days."""
    now = timezone.now()
    future = now + timedelta(days=days)
    return (
        Trip.objects.filter(
            is_deleted=False,
            status__in=["DRAFT", "DISPATCHED"],
            planned_start_time__gte=now,
            planned_start_time__lte=future,
        )
        .select_related("vehicle", "driver")
        .order_by("planned_start_time")
    )


def get_current_trips() -> QuerySet[Trip]:
    """Trips currently in progress."""
    return (
        Trip.objects.filter(is_deleted=False, status__in=["DISPATCHED", "IN_PROGRESS"])
        .select_related("vehicle", "driver")
        .order_by("-dispatch_date")
    )
