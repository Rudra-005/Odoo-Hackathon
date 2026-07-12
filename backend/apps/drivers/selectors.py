from django.db.models import QuerySet, Q
from .models import Driver, DriverLicense

def get_drivers(*, filters=None) -> QuerySet[Driver]:
    """
    Returns a queryset of Drivers with applied filters, searches, and optimizations.
    """
    qs = Driver.objects.filter(is_deleted=False).select_related('company', 'license')

    if filters:
        # Filtering
        if 'status' in filters and filters['status']:
            qs = qs.filter(status=filters['status'])
            
        if 'license_category' in filters and filters['license_category']:
            qs = qs.filter(license__license_category=filters['license_category'])
            
        if 'experience' in filters and filters['experience']:
            qs = qs.filter(experience__gte=filters['experience'])
            
        if 'safety_score' in filters and filters['safety_score']:
            qs = qs.filter(safety_score__gte=filters['safety_score'])
            
        # Searching
        if 'search' in filters and filters['search']:
            search_query = filters['search']
            qs = qs.filter(
                Q(driver_code__icontains=search_query) |
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(phone__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(license__license_number__icontains=search_query)
            )

        # Sorting
        if 'ordering' in filters and filters['ordering']:
            if filters['ordering'] == 'driver_name':
                qs = qs.order_by('first_name', 'last_name')
            elif filters['ordering'] == '-driver_name':
                qs = qs.order_by('-first_name', '-last_name')
            elif filters['ordering'] == 'license_expiry':
                qs = qs.order_by('license__license_expiry')
            elif filters['ordering'] == '-license_expiry':
                qs = qs.order_by('-license__license_expiry')
            else:
                qs = qs.order_by(filters['ordering'])
        else:
            qs = qs.order_by('-created_at')

    return qs

def get_driver_detail(driver_id: str) -> Driver:
    """
    Returns a single Driver instance optimized for detail view.
    """
    return Driver.objects.select_related('company', 'license').get(
        id=driver_id, 
        is_deleted=False
    )
