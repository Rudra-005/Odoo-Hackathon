from django.db.models import Sum, Count, Q, F, Avg, ExpressionWrapper, FloatField
from django.db.models.functions import TruncMonth, TruncDate
from apps.vehicles.models import Vehicle
from apps.drivers.models import Driver
from apps.trips.models import Trip
from apps.expenses.models import Expense
from apps.fuel.models import FuelLog
from apps.maintenance.models import MaintenanceLog
import datetime

class ReportSelector:
    @staticmethod
    def get_fleet_report(filters):
        # Apply filters (dates, regions, etc)
        qs = Vehicle.objects.all()
        
        # Aggregations
        total = qs.count()
        active = qs.filter(status__in=['AVAILABLE', 'ON_TRIP']).count()
        in_shop = qs.filter(status='IN_SHOP').count()
        on_trip = qs.filter(status='ON_TRIP').count()
        
        utilization = (on_trip / total * 100) if total > 0 else 0
        avg_odometer = qs.aggregate(avg=Avg('current_odometer'))['avg'] or 0

        # Vehicle list data
        vehicles = qs.values(
            'id', 'registration_number', 'status', 'vehicle_type', 'current_odometer'
        ).annotate(
            total_trips=Count('trips'),
        )

        return {
            'summary': {
                'total_vehicles': total,
                'active_vehicles': active,
                'in_shop': in_shop,
                'on_trip': on_trip,
                'utilization_rate': float(utilization),
                'average_odometer': float(avg_odometer)
            },
            'data': list(vehicles)
        }

    @staticmethod
    def get_financial_report(filters):
        start_date = filters.get('start_date')
        end_date = filters.get('end_date')

        trip_qs = Trip.objects.filter(status='COMPLETED')
        expense_qs = Expense.objects.all()

        if start_date:
            trip_qs = trip_qs.filter(completion_date__date__gte=start_date)
            expense_qs = expense_qs.filter(expense_date__gte=start_date)
        if end_date:
            trip_qs = trip_qs.filter(completion_date__date__lte=end_date)
            expense_qs = expense_qs.filter(expense_date__lte=end_date)

        total_revenue = trip_qs.aggregate(total=Sum('revenue'))['total'] or 0
        total_expense = expense_qs.aggregate(total=Sum('net_amount'))['total'] or 0
        
        net_profit = float(total_revenue) - float(total_expense)

        # Expense breakdown
        expense_by_category = expense_qs.values('category__name').annotate(
            total=Sum('net_amount')
        ).order_by('-total')

        # Revenue vs Expense over time
        revenue_trend = trip_qs.annotate(
            date=TruncDate('completion_date')
        ).values('date').annotate(total=Sum('revenue')).order_by('date')
        
        expense_trend = expense_qs.annotate(
            date=TruncDate('expense_date')
        ).values('date').annotate(total=Sum('net_amount')).order_by('date')
        
        # Merge trends
        trend_dict = {}
        for r in revenue_trend:
            d_str = r['date'].strftime('%Y-%m-%d') if r['date'] else 'Unknown'
            trend_dict[d_str] = {'date': d_str, 'revenue': float(r['total']), 'expense': 0}
            
        for e in expense_trend:
            d_str = e['date'].strftime('%Y-%m-%d') if e['date'] else 'Unknown'
            if d_str not in trend_dict:
                trend_dict[d_str] = {'date': d_str, 'revenue': 0, 'expense': 0}
            trend_dict[d_str]['expense'] = float(e['total'])

        return {
            'summary': {
                'total_revenue': float(total_revenue),
                'total_expense': float(total_expense),
                'net_profit': float(net_profit),
                'roi': (float(net_profit) / float(total_expense) * 100) if total_expense else 0
            },
            'expense_breakdown': list(expense_by_category),
            'trend': sorted(list(trend_dict.values()), key=lambda x: x['date']),
            'data': list(expense_qs.values('expense_number', 'expense_date', 'category__name', 'net_amount', 'status')[:100])
        }

    @staticmethod
    def get_trip_report(filters):
        qs = Trip.objects.select_related('vehicle', 'driver').all()
        
        total_trips = qs.count()
        completed = qs.filter(status='COMPLETED').count()
        total_distance = qs.aggregate(total=Sum('actual_distance'))['total'] or 0
        total_revenue = qs.aggregate(total=Sum('revenue'))['total'] or 0

        trips = qs.values(
            'id', 'trip_number', 'vehicle__registration_number', 'driver__first_name', 'driver__last_name',
            'status', 'actual_distance', 'revenue', 'start_time', 'end_time'
        )[:100]

        return {
            'summary': {
                'total_trips': total_trips,
                'completed_trips': completed,
                'total_distance': float(total_distance),
                'total_revenue': float(total_revenue),
                'average_distance': float(total_distance / completed) if completed else 0
            },
            'data': list(trips)
        }
