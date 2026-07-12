from rest_framework import serializers
from .models import FuelLog

class FuelLogSerializer(serializers.ModelSerializer):
    vehicle_registration = serializers.CharField(source='vehicle.registration_number', read_only=True)
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    trip_number = serializers.CharField(source='trip.trip_number', read_only=True)
    
    class Meta:
        model = FuelLog
        fields = '__all__'
        read_only_fields = (
            'company', 'fuel_log_number', 'total_cost', 'distance_since_last',
            'fuel_efficiency', 'created_by', 'updated_by'
        )

class FuelLogWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = FuelLog
        fields = [
            'vehicle', 'trip', 'driver', 'fuel_station', 'fuel_vendor',
            'fuel_type', 'quantity', 'price_per_unit', 'odometer_reading',
            'payment_method', 'invoice_number', 'invoice_upload', 'fuel_date',
            'remarks'
        ]
