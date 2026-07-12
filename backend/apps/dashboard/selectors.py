from django.db.models import Sum, Count, Q, F, Avg
from django.utils import timezone
from datetime import timedelta
from apps.vehicles.models import Vehicle
from apps.drivers.models import Driver
from apps.trips.models import Trip
from apps.expenses.models import Expense
from apps.maintenance.models import MaintenanceLog
from apps.fuel.models import FuelLog

class DashboardSelector:
    @staticmethod
    def get_summary():
        today = timezone.now().date()
        
        # Vehicle Stats
        total_vehicles = Vehicle.objects.count()
        active_vehicles = Vehicle.objects.filter(status__in=['AVAILABLE', 'ON_TRIP']).count()
        
        # Trip Stats
        active_trips = Trip.objects.filter(status='IN_PROGRESS').count()
        today_revenue = Trip.objects.filter(
            status='COMPLETED', 
            completion_date__date=today
        ).aggregate(total=Sum('revenue'))['total'] or 0

        # Expense Stats
        today_expense = Expense.objects.filter(
            expense_date=today
        ).aggregate(total=Sum('net_amount'))['total'] or 0
        
        profit = float(today_revenue) - float(today_expense)

        return {
            'total_vehicles': total_vehicles,
            'active_vehicles': active_vehicles,
            'utilization_rate': (active_vehicles / total_vehicles * 100) if total_vehicles > 0 else 0,
            'active_trips': active_trips,
            'today_revenue': float(today_revenue),
            'today_expense': float(today_expense),
            'today_profit': profit
        }

    @staticmethod
    def get_kpis():
        # Vehicle Status Distribution
        vehicle_status = Vehicle.objects.values('status').annotate(count=Count('id'))
        
        # Driver Stats
        driver_stats = {
            'total': Driver.objects.count(),
            'available': Driver.objects.filter(status='AVAILABLE').count(),
            'on_trip': Driver.objects.filter(status='ON_TRIP').count(),
            'suspended': Driver.objects.filter(status='SUSPENDED').count()
        }

        # Current Month Financials
        start_of_month = timezone.now().replace(day=1, hour=0, minute=0, second=0).date()
        
        monthly_revenue = Trip.objects.filter(
            status='COMPLETED',
            completion_date__date__gte=start_of_month
        ).aggregate(total=Sum('revenue'))['total'] or 0
        
        monthly_expense = Expense.objects.filter(
            expense_date__gte=start_of_month
        ).aggregate(total=Sum('net_amount'))['total'] or 0
        
        # Maintenance Cost this month
        maintenance_cost = Expense.objects.filter(
            category__name='MAINTENANCE',
            expense_date__gte=start_of_month
        ).aggregate(total=Sum('net_amount'))['total'] or 0

        # Fuel Cost this month
        fuel_cost = Expense.objects.filter(
            category__name='FUEL',
            expense_date__gte=start_of_month
        ).aggregate(total=Sum('net_amount'))['total'] or 0

        # New Scheduling & Collision Engine KPIs
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        
        trips_today = Trip.objects.filter(
            is_deleted=False,
            planned_start_time__date=today
        ).count()
        
        trips_this_week = Trip.objects.filter(
            is_deleted=False,
            planned_start_time__date__gte=start_of_week
        ).count()

        vehicles_busy = Vehicle.objects.filter(status='ON_TRIP').count()
        drivers_busy = Driver.objects.filter(status='ON_TRIP').count()
        
        vehicles_available = Vehicle.objects.filter(status='AVAILABLE').count()
        drivers_available = Driver.objects.filter(status='AVAILABLE').count()
        
        maintenance_today = MaintenanceLog.objects.filter(
            is_deleted=False,
            status='ACTIVE'
        ).count()

        avg_trip_duration = Trip.objects.filter(
            is_deleted=False,
            status='COMPLETED',
            actual_duration__isnull=False
        ).aggregate(avg=Avg('actual_duration'))['avg'] or 0.0

        avg_fuel_consumption = Trip.objects.filter(
            is_deleted=False,
            status='COMPLETED',
            fuel_consumed__isnull=False
        ).aggregate(avg=Avg('fuel_consumed'))['avg'] or 0.0

        # Drivers whose license expires in next 30 days
        upcoming_license_expiry = Driver.objects.filter(
            is_deleted=False,
            license__license_expiry__lte=today + timedelta(days=30),
            license__license_expiry__gte=today
        ).count()

        # Maintenance scheduled in next 7 days
        upcoming_maintenance = MaintenanceLog.objects.filter(
            is_deleted=False,
            status='SCHEDULED',
            maintenance_start__date__gte=today,
            maintenance_start__date__lte=today + timedelta(days=7)
        ).count()

        return {
            'vehicle_status': {item['status']: item['count'] for item in vehicle_status},
            'driver_stats': driver_stats,
            'monthly_financials': {
                'revenue': float(monthly_revenue),
                'expense': float(monthly_expense),
                'profit': float(monthly_revenue) - float(monthly_expense),
                'maintenance_cost': float(maintenance_cost),
                'fuel_cost': float(fuel_cost)
            },
            'scheduling_kpis': {
                'trips_today': trips_today,
                'trips_this_week': trips_this_week,
                'vehicles_busy': vehicles_busy,
                'drivers_busy': drivers_busy,
                'vehicles_available': vehicles_available,
                'drivers_available': drivers_available,
                'maintenance_today': maintenance_today,
                'avg_trip_duration': float(avg_trip_duration),
                'avg_fuel_consumption': float(avg_fuel_consumption),
                'upcoming_license_expiry': upcoming_license_expiry,
                'upcoming_maintenance': upcoming_maintenance
            }
        }

    @staticmethod
    def get_charts():
        # Last 6 months trend (Revenue vs Expense)
        today = timezone.now().date()
        six_months_ago = today - timedelta(days=180)
        
        from django.db.models.functions import TruncMonth
        
        monthly_revenue = Trip.objects.filter(
            status='COMPLETED',
            completion_date__date__gte=six_months_ago
        ).annotate(
            month=TruncMonth('completion_date')
        ).values('month').annotate(
            total=Sum('revenue')
        ).order_by('month')
        
        monthly_expense = Expense.objects.filter(
            expense_date__gte=six_months_ago
        ).annotate(
            month=TruncMonth('expense_date')
        ).values('month').annotate(
            total=Sum('net_amount')
        ).order_by('month')

        # Format for Recharts
        trend_data = {}
        for r in monthly_revenue:
            m = r['month'].strftime('%b %Y')
            trend_data[m] = {'month': m, 'revenue': float(r['total']), 'expense': 0}
            
        for e in monthly_expense:
            m = e['month'].strftime('%b %Y')
            if m not in trend_data:
                trend_data[m] = {'month': m, 'revenue': 0, 'expense': 0}
            trend_data[m]['expense'] = float(e['total'])

        return {
            'revenue_expense_trend': list(trend_data.values()),
        }

    @staticmethod
    def get_recent_activity():
        recent_trips = Trip.objects.select_related('vehicle', 'driver').order_by('-created_at')[:5]
        recent_expenses = Expense.objects.select_related('category', 'vehicle').order_by('-created_at')[:5]
        
        return {
            'trips': [
                {
                    'id': str(t.id),
                    'number': t.trip_number,
                    'vehicle': t.vehicle.registration_number,
                    'driver': t.driver.driver_name if t.driver else '-',
                    'status': t.status,
                    'revenue': float(t.revenue) if t.revenue else 0
                } for t in recent_trips
            ],
            'expenses': [
                {
                    'id': str(e.id),
                    'number': e.expense_number,
                    'category': e.category.name,
                    'vehicle': e.vehicle.registration_number if e.vehicle else '-',
                    'amount': float(e.net_amount),
                    'status': e.status
                } for e in recent_expenses
            ]
        }
