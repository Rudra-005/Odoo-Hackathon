from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import MaintenanceType, MaintenanceLog
from .serializers import (
    MaintenanceTypeSerializer, MaintenanceLogSerializer, 
    MaintenanceLogWriteSerializer, MaintenanceCompleteSerializer
)
from apps.common.workflow.orchestrators import MaintenanceWorkflowService

class MaintenanceTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MaintenanceType.objects.all()
    serializer_class = MaintenanceTypeSerializer

class MaintenanceLogViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        # We filter by company in a real multi-tenant app
        return MaintenanceLog.objects.all().select_related('vehicle', 'maintenance_type').order_by('-created_at')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return MaintenanceLogWriteSerializer
        return MaintenanceLogSerializer

    def perform_create(self, serializer):
        # Assign company implicitly here
        # Assuming the first company for the demo
        from apps.common.models import Company
        company = Company.objects.first()
        serializer.save(company=company, created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        log = self.get_object()
        try:
            MaintenanceWorkflowService.start_maintenance(log, request.user)
            return Response(self.get_serializer(log).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        log = self.get_object()
        serializer = MaintenanceCompleteSerializer(data=request.data)
        if serializer.is_valid():
            try:
                MaintenanceWorkflowService.complete_maintenance(log, request.user, serializer.validated_data)
                return Response(self.get_serializer(log).data)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        log = self.get_object()
        try:
            MaintenanceWorkflowService.cancel_maintenance(log, request.user)
            return Response(self.get_serializer(log).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
