from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.core.exceptions import ValidationError
from .models import Vehicle
from .selectors import get_vehicles, get_vehicle_detail
from .services import create_vehicle, update_vehicle, delete_vehicle, bulk_delete_vehicles, bulk_update_vehicle_status
from .serializers import VehicleListSerializer, VehicleDetailSerializer, VehicleWriteSerializer

class VehicleViewSet(viewsets.ModelViewSet):
    """
    Enterprise API endpoint for Vehicle Management.
    Follows Service/Selector pattern instead of fat views.
    """
    def get_queryset(self):
        return get_vehicles(filters=self.request.query_params)

    def get_serializer_class(self):
        if self.action == 'list':
            return VehicleListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return VehicleWriteSerializer
        return VehicleDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            vehicle = create_vehicle(user=request.user, data=serializer.validated_data)
            return Response(VehicleDetailSerializer(vehicle).data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        vehicle = self.get_object()
        serializer = self.get_serializer(vehicle, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            vehicle = update_vehicle(vehicle=vehicle, user=request.user, data=serializer.validated_data)
            return Response(VehicleDetailSerializer(vehicle).data)
        except ValidationError as e:
            return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        vehicle = self.get_object()
        delete_vehicle(vehicle=vehicle, user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def retrieve(self, request, *args, **kwargs):
        # Override to use get_vehicle_detail which has optimizations
        vehicle = get_vehicle_detail(self.kwargs['pk'])
        return Response(self.get_serializer(vehicle).data)

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        vehicle_ids = request.data.get('ids', [])
        if not vehicle_ids:
            return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
        bulk_delete_vehicles(vehicle_ids=vehicle_ids, user=request.user)
        return Response({"message": f"Successfully deleted {len(vehicle_ids)} vehicles."})

    @action(detail=False, methods=['post'], url_path='bulk-status')
    def bulk_status(self, request):
        vehicle_ids = request.data.get('ids', [])
        new_status = request.data.get('status')
        if not vehicle_ids or not new_status:
            return Response({"error": "IDs and status required"}, status=status.HTTP_400_BAD_REQUEST)
        bulk_update_vehicle_status(vehicle_ids=vehicle_ids, status=new_status, user=request.user)
        return Response({"message": f"Successfully updated status for {len(vehicle_ids)} vehicles."})
