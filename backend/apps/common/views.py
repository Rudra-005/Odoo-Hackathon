from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Q
from apps.vehicles.models import Vehicle
from apps.drivers.models import Driver
from apps.trips.models import Trip
from .models import Company, Settings
from .serializers import CompanySerializer
class GlobalSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        query = request.GET.get('q', '').strip()
        if not query:
            return Response([])

        results = []

        # Search Vehicles
        vehicles = Vehicle.objects.filter(
            Q(registration_number__icontains=query) | Q(vehicle_name__icontains=query)
        )[:5]
        for v in vehicles:
            results.append({
                'id': str(v.id),
                'type': 'Vehicle',
                'title': v.registration_number,
                'subtitle': v.vehicle_name,
                'url': '/vehicles'
            })

        # Search Drivers
        drivers = Driver.objects.filter(
            Q(first_name__icontains=query) | Q(last_name__icontains=query) | Q(driver_code__icontains=query)
        )[:5]
        for d in drivers:
            results.append({
                'id': str(d.id),
                'type': 'Driver',
                'title': d.driver_name,
                'subtitle': d.driver_code,
                'url': '/drivers'
            })

        # Search Trips
        trips = Trip.objects.filter(
            Q(trip_number__icontains=query) | Q(source__icontains=query) | Q(destination__icontains=query)
        )[:5]
        for t in trips:
            results.append({
                'id': str(t.id),
                'type': 'Trip',
                'title': t.trip_number,
                'subtitle': f"{t.source} -> {t.destination}",
                'url': '/trips'
            })

        return Response(results)

class CompanySettingsView(APIView):
    permission_classes = [AllowAny] # For hackathon, typically IsAuthenticated

    def get_company(self):
        company = Company.objects.first()
        if not company:
            company = Company.objects.create(
                name="TransitOps Global",
                gst_number="REG-2024-9982",
                address="123 Logistics Avenue, Enterprise Zone, NY 10001",
                email="contact@transitops.com",
                phone="+1 (555) 123-4567"
            )
        return company

    def get(self, request, *args, **kwargs):
        company = self.get_company()
        serializer = CompanySerializer(company)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def put(self, request, *args, **kwargs):
        company = self.get_company()
        serializer = CompanySerializer(company, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'data': serializer.data,
                'message': 'Company settings updated successfully'
            })
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=400)