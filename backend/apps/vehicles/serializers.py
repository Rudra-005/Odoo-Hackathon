from rest_framework import serializers
from .models import Vehicle, VehicleType, VehicleDocument

class VehicleTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleType
        fields = ('id', 'name', 'description')

class VehicleDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleDocument
        fields = ('id', 'document_type', 'image_url', 'expiry_date')

class VehicleListSerializer(serializers.ModelSerializer):
    """Optimized serializer for the TanStack DataTable list view."""
    vehicle_type_name = serializers.CharField(source='vehicle_type.get_name_display', read_only=True)
    region_name = serializers.CharField(source='region.name', read_only=True)
    
    class Meta:
        model = Vehicle
        fields = (
            'id', 'image', 'registration_number', 'vehicle_name', 'model', 
            'maximum_load_capacity', 'status', 'region_name', 'vehicle_type_name',
            'current_odometer', 'created_at'
        )

class VehicleDetailSerializer(serializers.ModelSerializer):
    """Comprehensive serializer for the Detail page."""
    vehicle_type = VehicleTypeSerializer(read_only=True)
    documents = VehicleDocumentSerializer(many=True, read_only=True)
    region_name = serializers.CharField(source='region.name', read_only=True)
    
    class Meta:
        model = Vehicle
        fields = '__all__'

class VehicleWriteSerializer(serializers.ModelSerializer):
    """Serializer for Validation/Writing ONLY."""
    class Meta:
        model = Vehicle
        fields = (
            'company', 'region', 'vehicle_type', 'registration_number', 
            'vin_number', 'vehicle_name', 'model', 'manufacturer', 'year', 
            'fuel_type', 'maximum_load_capacity', 'current_odometer', 
            'acquisition_cost', 'purchase_date', 'insurance_number', 
            'insurance_expiry', 'fitness_expiry', 'status', 'description', 'image'
        )
