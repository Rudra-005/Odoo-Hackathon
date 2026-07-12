from django.db.models import QuerySet, Q
from .models import Vehicle

def get_vehicles(*, filters=None) -> QuerySet[Vehicle]:
    """
    Returns a queryset of Vehicles with applied filters, searches, and optimizations.
    """
    qs = Vehicle.objects.filter(is_deleted=False).select_related('company', 'region', 'vehicle_type')

    if filters:
        # Filtering
        if 'status' in filters and filters['status']:
            qs = qs.filter(status=filters['status'])
            
        if 'vehicle_type' in filters and filters['vehicle_type']:
            qs = qs.filter(vehicle_type_id=filters['vehicle_type'])
            
        if 'region' in filters and filters['region']:
            qs = qs.filter(region_id=filters['region'])
            
        if 'fuel_type' in filters and filters['fuel_type']:
            qs = qs.filter(fuel_type=filters['fuel_type'])
            
        if 'manufacturer' in filters and filters['manufacturer']:
            qs = qs.filter(manufacturer__icontains=filters['manufacturer'])
            
        # Searching
        if 'search' in filters and filters['search']:
            search_query = filters['search']
            qs = qs.filter(
                Q(registration_number__icontains=search_query) |
                Q(vehicle_name__icontains=search_query) |
                Q(vin_number__icontains=search_query)
            )

        # Sorting
        if 'ordering' in filters and filters['ordering']:
            qs = qs.order_by(filters['ordering'])
        else:
            qs = qs.order_by('-created_at') # Default latest first

    return qs

def get_vehicle_detail(vehicle_id: str) -> Vehicle:
    """
    Returns a single Vehicle instance optimized for detail view.
    """
    return Vehicle.objects.select_related('company', 'region', 'vehicle_type').get(
        id=vehicle_id, 
        is_deleted=False
    )
