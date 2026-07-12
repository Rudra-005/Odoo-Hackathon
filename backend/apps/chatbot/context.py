"""
Chatbot context builder — pulls live data from the DB to inject into the system prompt.
"""
from django.utils import timezone
from django.db.models import Sum, Avg, Count, Q
from datetime import timedelta


def get_fleet_context() -> str:
    from apps.vehicles.models import Vehicle
    from apps.drivers.models import Driver
    from apps.trips.models import Trip
    from apps.maintenance.models import MaintenanceLog
    from apps.expenses.models import Expense
    from apps.fuel.models import FuelLog

    today = timezone.now().date()
    month_start = today.replace(day=1)

    v = Vehicle.objects.aggregate(
        total=Count('id'),
        available=Count('id', filter=Q(status='AVAILABLE')),
        on_trip=Count('id', filter=Q(status='ON_TRIP')),
        maintenance=Count('id', filter=Q(status='MAINTENANCE')),
        retired=Count('id', filter=Q(status='RETIRED')),
    )

    d = Driver.objects.aggregate(
        total=Count('id'),
        available=Count('id', filter=Q(status='AVAILABLE')),
        on_trip=Count('id', filter=Q(status='ON_TRIP')),
        suspended=Count('id', filter=Q(status='SUSPENDED')),
    )

    t = Trip.objects.aggregate(
        total=Count('id'),
        draft=Count('id', filter=Q(status='DRAFT')),
        dispatched=Count('id', filter=Q(status='DISPATCHED')),
        in_progress=Count('id', filter=Q(status='IN_PROGRESS')),
        completed=Count('id', filter=Q(status='COMPLETED')),
        cancelled=Count('id', filter=Q(status='CANCELLED')),
    )

    monthly_revenue = Trip.objects.filter(
        status='COMPLETED', completion_date__date__gte=month_start
    ).aggregate(total=Sum('revenue'))['total'] or 0

    today_trips = Trip.objects.filter(
        is_deleted=False, planned_start_time__date=today
    ).count()

    active_maintenance = MaintenanceLog.objects.filter(
        status__in=['SCHEDULED', 'ACTIVE']
    ).count()

    monthly_expense = Expense.objects.filter(
        expense_date__gte=month_start
    ).aggregate(total=Sum('net_amount'))['total'] or 0

    avg_efficiency = FuelLog.objects.filter(
        fuel_efficiency__gt=0
    ).aggregate(avg=Avg('fuel_efficiency'))['avg'] or 0

    expiring_licenses = Driver.objects.filter(
        is_deleted=False,
        license__license_expiry__lte=today + timedelta(days=30),
        license__license_expiry__gte=today,
    ).count()

    recent_trips = Trip.objects.select_related('vehicle', 'driver').order_by('-created_at')[:5]
    recent_trips_text = "\n".join([
        f"  - {tr.trip_number}: {tr.source} → {tr.destination} | "
        f"Status: {tr.status} | "
        f"Driver: {tr.driver.driver_name if tr.driver else 'N/A'} | "
        f"Vehicle: {tr.vehicle.registration_number if tr.vehicle else 'N/A'}"
        for tr in recent_trips
    ]) or "  No recent trips."

    return f"""
=== LIVE FLEET DATA (as of {timezone.now().strftime('%Y-%m-%d %H:%M UTC')}) ===

VEHICLES:
  Total: {v['total']} | Available: {v['available']} | On Trip: {v['on_trip']} | In Maintenance: {v['maintenance']} | Retired: {v['retired']}

DRIVERS:
  Total: {d['total']} | Available: {d['available']} | On Trip: {d['on_trip']} | Suspended: {d['suspended']}
  Licenses expiring in 30 days: {expiring_licenses}

TRIPS:
  Total: {t['total']} | Draft: {t['draft']} | Dispatched: {t['dispatched']} | In Progress: {t['in_progress']} | Completed: {t['completed']} | Cancelled: {t['cancelled']}
  Trips scheduled today: {today_trips}

FINANCIALS (this month):
  Revenue: ₹{float(monthly_revenue):,.2f} | Expenses: ₹{float(monthly_expense):,.2f} | Profit: ₹{float(monthly_revenue) - float(monthly_expense):,.2f}

MAINTENANCE:
  Active/Scheduled jobs: {active_maintenance}

FUEL:
  Average fleet efficiency: {float(avg_efficiency):.2f} km/L

RECENT TRIPS:
{recent_trips_text}
"""
