from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.core.exceptions import ValidationError
from .models import Driver
from .selectors import get_drivers, get_driver_detail
from .services import create_driver, update_driver, delete_driver, bulk_delete_drivers, bulk_update_driver_status
from .serializers import DriverListSerializer, DriverDetailSerializer, DriverWriteSerializer

class DriverViewSet(viewsets.ModelViewSet):
    """
    Enterprise API endpoint for Driver Management.
    """
    def get_queryset(self):
        return get_drivers(filters=self.request.query_params)

    def get_serializer_class(self):
        if self.action == 'list':
            return DriverListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return DriverWriteSerializer
        return DriverDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            driver = create_driver(user=request.user, data=serializer.validated_data)
            return Response(DriverDetailSerializer(driver).data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        driver = self.get_object()
        serializer = self.get_serializer(driver, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            driver = update_driver(driver=driver, user=request.user, data=serializer.validated_data)
            return Response(DriverDetailSerializer(driver).data)
        except ValidationError as e:
            return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        driver = self.get_object()
        delete_driver(driver=driver, user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def retrieve(self, request, *args, **kwargs):
        driver = get_driver_detail(self.kwargs['pk'])
        return Response(self.get_serializer(driver).data)

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        driver_ids = request.data.get('ids', [])
        if not driver_ids:
            return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
        bulk_delete_drivers(driver_ids=driver_ids, user=request.user)
        return Response({"message": f"Successfully deleted {len(driver_ids)} drivers."})

    @action(detail=False, methods=['post'], url_path='bulk-status')
    def bulk_status(self, request):
        driver_ids = request.data.get('ids', [])
        new_status = request.data.get('status')
        if not driver_ids or not new_status:
            return Response({"error": "IDs and status required"}, status=status.HTTP_400_BAD_REQUEST)
        bulk_update_driver_status(driver_ids=driver_ids, status=new_status, user=request.user)
        return Response({"message": f"Successfully updated status for {len(driver_ids)} drivers."})
