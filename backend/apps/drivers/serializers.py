from rest_framework import serializers
from .models import Driver, DriverLicense
from apps.common.models import Company

class DriverLicenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriverLicense
        fields = (
            'license_number', 'license_category', 'license_issue_date',
            'license_expiry', 'license_authority', 'document_url'
        )

class DriverListSerializer(serializers.ModelSerializer):
    """Optimized serializer for the TanStack DataTable list view."""
    license_number = serializers.CharField(source='license.license_number', read_only=True)
    license_category = serializers.CharField(source='license.get_license_category_display', read_only=True)
    license_expiry = serializers.DateField(source='license.license_expiry', read_only=True)
    
    class Meta:
        model = Driver
        fields = (
            'id', 'photo', 'driver_code', 'first_name', 'last_name', 'driver_name',
            'phone', 'status', 'safety_score', 'joining_date', 
            'license_number', 'license_category', 'license_expiry', 'assigned_vehicle', 'created_at'
        )

class DriverDetailSerializer(serializers.ModelSerializer):
    """Comprehensive serializer for the Detail page."""
    license = DriverLicenseSerializer(read_only=True)
    
    class Meta:
        model = Driver
        fields = '__all__'

class DriverWriteSerializer(serializers.ModelSerializer):
    """Serializer for Validation/Writing ONLY."""
    license = DriverLicenseSerializer(required=False)
    company = serializers.PrimaryKeyRelatedField(queryset=Company.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Driver
        fields = (
            'company', 'first_name', 'last_name', 'gender', 'dob', 'blood_group', 
            'email', 'phone', 'alt_phone', 'address', 'city', 'state', 
            'country', 'pincode', 'joining_date', 'experience', 
            'emergency_contact_name', 'emergency_contact_number', 
            'medical_certificate_number', 'medical_certificate_expiry', 
            'safety_score', 'salary', 'remarks', 'status', 'photo', 'license', 'assigned_vehicle'
        )
