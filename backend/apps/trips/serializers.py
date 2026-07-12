"""
Trip serializers — extended with scheduling fields and availability endpoint.
All existing serializers remain backward-compatible.
"""
from rest_framework import serializers
from .models import Trip, TripHistory
from apps.vehicles.serializers import VehicleListSerializer
from apps.drivers.serializers import DriverListSerializer


class TripHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source="changed_by.get_full_name", read_only=True)

    class Meta:
        model = TripHistory
        fields = ("id", "changed_by_name", "old_status", "new_status", "notes", "created_at")


class TripListSerializer(serializers.ModelSerializer):
    """Optimized serializer for the TanStack DataTable list view."""
    vehicle_reg = serializers.CharField(source="vehicle.registration_number", read_only=True)
    driver_name = serializers.CharField(source="driver.driver_name", read_only=True)
    region_name = serializers.CharField(source="region.name", read_only=True)

    class Meta:
        model = Trip
        fields = (
            "id", "trip_number", "vehicle_reg", "driver_name", "region_name", "source",
            "destination", "status", "revenue", "planned_distance",
            "planned_start_time", "planned_end_time",
            "dispatch_date", "created_at",
        )


class TripDetailSerializer(serializers.ModelSerializer):
    """Comprehensive serializer for the Detail page."""
    vehicle = VehicleListSerializer(read_only=True)
    driver = DriverListSerializer(read_only=True)
    region_name = serializers.CharField(source="region.name", read_only=True)
    history = TripHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Trip
        fields = "__all__"


class TripWriteSerializer(serializers.ModelSerializer):
    """Serializer for Validation/Writing — includes scheduling time fields."""

    class Meta:
        model = Trip
        fields = (
            "company", "source", "destination", "intermediate_stops",
            "region", "vehicle", "driver", "cargo_type", "cargo_description",
            "cargo_weight", "planned_distance", "estimated_duration",
            "revenue", "customer_name", "customer_contact", "remarks",
            # Scheduling fields
            "planned_start_time", "planned_end_time",
        )


class TripCompleteSerializer(serializers.Serializer):
    """Serializer strictly for completion payloads."""
    actual_distance = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    actual_duration = serializers.DecimalField(max_digits=6, decimal_places=2, required=True)
    start_odometer = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    end_odometer = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    fuel_consumed = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)


# ---------------------------------------------------------------------------
# Scheduling / Availability serializers
# ---------------------------------------------------------------------------

class AvailabilityRequestSerializer(serializers.Serializer):
    """Query params for availability check endpoint."""
    planned_start_time = serializers.DateTimeField(required=True)
    planned_end_time = serializers.DateTimeField(required=True)
    trip_id = serializers.UUIDField(required=False)


class VehicleAvailabilitySerializer(serializers.Serializer):
    """Slim vehicle representation for the availability dropdown."""
    id = serializers.UUIDField()
    registration_number = serializers.CharField()
    vehicle_name = serializers.CharField()
    vehicle_type_name = serializers.SerializerMethodField()
    maximum_load_capacity = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField()

    def get_vehicle_type_name(self, obj):
        return obj.vehicle_type.get_name_display() if obj.vehicle_type else ""


class DriverAvailabilitySerializer(serializers.Serializer):
    """Slim driver representation for the availability dropdown."""
    id = serializers.UUIDField()
    driver_code = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    status = serializers.CharField()
    safety_score = serializers.DecimalField(max_digits=5, decimal_places=2)
    assigned_vehicle_reg = serializers.CharField(source='assigned_vehicle.registration_number', allow_null=True, required=False)


class TripScheduleSerializer(serializers.ModelSerializer):
    """Serializer for the schedule / calendar view."""
    vehicle_reg = serializers.CharField(source="vehicle.registration_number", read_only=True)
    driver_name = serializers.CharField(source="driver.driver_name", read_only=True)

    class Meta:
        model = Trip
        fields = (
            "id", "trip_number", "vehicle_reg", "driver_name",
            "source", "destination", "status",
            "planned_start_time", "planned_end_time",
            "actual_start_time", "actual_end_time",
        )
