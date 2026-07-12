from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import FuelLog
from .serializers import FuelLogSerializer, FuelLogWriteSerializer
from apps.common.workflow.orchestrators import FuelWorkflowService

class FuelLogViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        # We filter by company in a real multi-tenant app
        return FuelLog.objects.all().select_related('vehicle', 'driver', 'trip').order_by('-fuel_date')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return FuelLogWriteSerializer
        return FuelLogSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Instantiate without saving to DB yet
        fuel_log = FuelLog(**serializer.validated_data)
        
        from apps.common.models import Company
        fuel_log.company = Company.objects.first()
        
        try:
            # Delegate entirely to the Workflow Engine
            fuel_log = FuelWorkflowService.create_fuel_log(fuel_log, request.user)
            
            response_serializer = FuelLogSerializer(fuel_log)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
