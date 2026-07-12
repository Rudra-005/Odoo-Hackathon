"""
Trip views — extended with scheduling endpoints.
All existing endpoints remain exactly as before.
"""
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.core.exceptions import ValidationError

from .models import Trip
from .selectors import get_trips, get_trip_detail, get_todays_trips, get_upcoming_trips, get_current_trips
from .services import create_trip, update_trip, delete_trip, dispatch_trip, start_trip, complete_trip, cancel_trip
from .scheduling import SchedulingEngine
from .serializers import (
    TripListSerializer, TripDetailSerializer, TripWriteSerializer, TripCompleteSerializer,
    AvailabilityRequestSerializer, VehicleAvailabilitySerializer, DriverAvailabilitySerializer,
    TripScheduleSerializer,
)


class TripViewSet(viewsets.ModelViewSet):
    """
    Enterprise API endpoint for Trip Management.
    """

    def get_queryset(self):
        return get_trips(filters=self.request.query_params)

    def get_serializer_class(self):
        if self.action == "list":
            return TripListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return TripWriteSerializer
        if self.action == "complete":
            return TripCompleteSerializer
        return TripDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            trip = create_trip(user=request.user, data=serializer.validated_data)
            return Response(TripDetailSerializer(trip).data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        trip = self.get_object()
        serializer = self.get_serializer(trip, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            trip = update_trip(trip=trip, user=request.user, data=serializer.validated_data)
            return Response(TripDetailSerializer(trip).data)
        except ValidationError as e:
            return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        trip = self.get_object()
        delete_trip(trip=trip, user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def retrieve(self, request, *args, **kwargs):
        trip = get_trip_detail(self.kwargs["pk"])
        return Response(TripDetailSerializer(trip).data)

    # ----------------------------------------------------------------
    # State Machine Endpoints (unchanged)
    # ----------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="dispatch")
    def dispatch_trip(self, request, pk=None):
        trip = self.get_object()
        try:
            trip = dispatch_trip(trip=trip, user=request.user)
            return Response(TripDetailSerializer(trip).data)
        except ValidationError as e:
            return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="start")
    def start_active_trip(self, request, pk=None):
        trip = self.get_object()
        try:
            trip = start_trip(trip=trip, user=request.user)
            return Response(TripDetailSerializer(trip).data)
        except ValidationError as e:
            return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete_active_trip(self, request, pk=None):
        trip = self.get_object()
        serializer = TripCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            trip = complete_trip(trip=trip, user=request.user, data=serializer.validated_data)
            return Response(TripDetailSerializer(trip).data)
        except ValidationError as e:
            return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel_active_trip(self, request, pk=None):
        trip = self.get_object()
        try:
            trip = cancel_trip(trip=trip, user=request.user)
            return Response(TripDetailSerializer(trip).data)
        except ValidationError as e:
            return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)

    # ----------------------------------------------------------------
    # NEW: Scheduling & Availability Endpoints
    # ----------------------------------------------------------------

    @action(detail=False, methods=["get"], url_path="schedule/today")
    def schedule_today(self, request):
        """Today's trips for the schedule board."""
        trips = get_todays_trips()
        return Response(TripScheduleSerializer(trips, many=True).data)

    @action(detail=False, methods=["get"], url_path="schedule/upcoming")
    def schedule_upcoming(self, request):
        """Upcoming trips (next 7 days by default)."""
        days = int(request.query_params.get("days", 7))
        trips = get_upcoming_trips(days=days)
        return Response(TripScheduleSerializer(trips, many=True).data)

    @action(detail=False, methods=["get"], url_path="schedule/current")
    def schedule_current(self, request):
        """All currently active trips."""
        trips = get_current_trips()
        return Response(TripScheduleSerializer(trips, many=True).data)

    @action(detail=False, methods=["get"], url_path="availability/vehicles")
    def available_vehicles(self, request):
        """
        Returns vehicles available for a given time window.
        Query params: planned_start_time, planned_end_time (ISO 8601), trip_id (optional)
        """
        serializer = AvailabilityRequestSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        vehicles = SchedulingEngine.get_available_vehicles(
            serializer.validated_data["planned_start_time"],
            serializer.validated_data["planned_end_time"],
            exclude_trip_id=serializer.validated_data.get("trip_id"),
        )
        return Response(VehicleAvailabilitySerializer(vehicles, many=True).data)

    @action(detail=False, methods=["get"], url_path="availability/drivers")
    def available_drivers(self, request):
        """
        Returns drivers available for a given time window.
        Query params: planned_start_time, planned_end_time (ISO 8601), trip_id (optional)
        """
        serializer = AvailabilityRequestSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        drivers = SchedulingEngine.get_available_drivers(
            serializer.validated_data["planned_start_time"],
            serializer.validated_data["planned_end_time"],
            exclude_trip_id=serializer.validated_data.get("trip_id"),
        )
        return Response(DriverAvailabilitySerializer(drivers, many=True).data)

    @action(detail=False, methods=["post"], url_path="check-availability")
    def check_availability(self, request):
        """
        Real-time conflict check — called by frontend before form submission.
        Returns 200 if no conflicts, 400 with detailed error if conflict found.
        Body: { vehicle, driver, planned_start_time, planned_end_time, cargo_weight, trip_id? }
        """
        from apps.vehicles.models import Vehicle
        from apps.drivers.models import Driver

        vehicle_id = request.data.get("vehicle")
        driver_id = request.data.get("driver")
        planned_start_time = request.data.get("planned_start_time")
        planned_end_time = request.data.get("planned_end_time")
        cargo_weight = request.data.get("cargo_weight")
        exclude_trip_id = request.data.get("trip_id")

        try:
            from django.utils.dateparse import parse_datetime
            start = parse_datetime(planned_start_time) if planned_start_time else None
            end = parse_datetime(planned_end_time) if planned_end_time else None

            vehicle = Vehicle.objects.get(id=vehicle_id) if vehicle_id else None
            driver = Driver.objects.get(id=driver_id) if driver_id else None

            SchedulingEngine.validate_trip_schedule(
                vehicle=vehicle,
                driver=driver,
                planned_start_time=start,
                planned_end_time=end,
                cargo_weight=float(cargo_weight) if cargo_weight else None,
                exclude_trip_id=exclude_trip_id,
                allow_past=False,
            )
            return Response({"available": True, "message": "No conflicts found."})
        except ValidationError as e:
            return Response(
                {"available": False, "errors": e.message_dict},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
