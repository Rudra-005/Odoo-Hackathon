from rest_framework import serializers
from .models import MaintenanceType, MaintenanceLog
from apps.vehicles.models import Vehicle

class MaintenanceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceType
        fields = '__all__'

class MaintenanceLogSerializer(serializers.ModelSerializer):
    vehicle_registration = serializers.CharField(source='vehicle.registration_number', read_only=True)
    maintenance_type_name = serializers.CharField(source='maintenance_type.get_name_display', read_only=True)
    
    class Meta:
        model = MaintenanceLog
        fields = '__all__'
        read_only_fields = ('company', 'maintenance_id', 'status', 'created_by', 'updated_by')

class MaintenanceLogWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceLog
        fields = [
            'vehicle', 'maintenance_type', 'workshop', 'vendor', 
            'mechanic_name', 'mechanic_contact', 'issue', 'diagnosis', 
            'description', 'priority', 'estimated_cost', 'estimated_completion',
            'parts_used', 'warranty', 'remarks', 'maintenance_start', 'maintenance_end'
        ]

class MaintenanceCompleteSerializer(serializers.Serializer):
    actual_cost = serializers.DecimalField(max_digits=12, decimal_places=2)
    invoice_number = serializers.CharField(required=False, allow_blank=True)
    invoice_upload = serializers.URLField(required=False, allow_blank=True)
    parts_used = serializers.CharField(required=False, allow_blank=True)
    remarks = serializers.CharField(required=False, allow_blank=True)
