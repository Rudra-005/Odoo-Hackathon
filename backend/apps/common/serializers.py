from rest_framework import serializers
from .models import Company, Settings

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'gst_number', 'address', 'phone', 'email', 'website']

class SettingsSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    
    class Meta:
        model = Settings
        fields = ['id', 'company', 'timezone', 'currency', 'language', 'theme', 'company_logo']
