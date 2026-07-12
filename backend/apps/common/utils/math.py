from decimal import Decimal

def calculate_fuel_efficiency(distance, fuel_consumed):
    """
    Returns fuel efficiency (km/l or mpg)
    """
    try:
        distance = Decimal(str(distance))
        fuel_consumed = Decimal(str(fuel_consumed))
        if fuel_consumed <= 0:
            return Decimal('0.00')
        return round(distance / fuel_consumed, 2)
    except (TypeError, ValueError):
        return Decimal('0.00')

def calculate_roi(revenue, cost):
    """
    Returns ROI as a percentage.
    """
    try:
        revenue = Decimal(str(revenue))
        cost = Decimal(str(cost))
        if cost <= 0:
            return Decimal('100.00') if revenue > 0 else Decimal('0.00')
        return round(((revenue - cost) / cost) * 100, 2)
    except (TypeError, ValueError):
        return Decimal('0.00')
