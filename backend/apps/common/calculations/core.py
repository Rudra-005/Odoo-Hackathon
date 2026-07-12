from decimal import Decimal
from apps.common.utils.math import calculate_fuel_efficiency, calculate_roi

class CalculationEngine:
    @staticmethod
    def calculate_trip_profit(revenue, expenses):
        """
        Net Profit = Revenue - All Expenses (Fuel + Tolls + Misc)
        """
        revenue = Decimal(str(revenue or 0))
        expenses = Decimal(str(expenses or 0))
        return revenue - expenses
        
    @staticmethod
    def calculate_fleet_utilization(active_vehicles, total_vehicles):
        """
        Returns percentage of active fleet.
        """
        if not total_vehicles:
            return Decimal('0.00')
        return round((Decimal(str(active_vehicles)) / Decimal(str(total_vehicles))) * 100, 2)
        
    @staticmethod
    def calculate_vehicle_efficiency(distance, fuel):
        return calculate_fuel_efficiency(distance, fuel)
        
    @staticmethod
    def calculate_vehicle_roi(revenue, cost):
        return calculate_roi(revenue, cost)
