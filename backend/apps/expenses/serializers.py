from rest_framework import serializers
from .models import ExpenseCategory, Expense

class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.get_name_display', read_only=True)
    vehicle_registration = serializers.CharField(source='vehicle.registration_number', read_only=True)
    trip_number = serializers.CharField(source='trip.trip_number', read_only=True)
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = (
            'company', 'expense_number', 'net_amount', 'status', 
            'created_by', 'updated_by'
        )

class ExpenseWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = [
            'category', 'vehicle', 'trip', 'driver', 'vendor', 
            'vendor_contact', 'invoice_number', 'invoice_upload',
            'expense_date', 'amount', 'tax', 'discount', 
            'payment_method', 'reference_number', 'description', 'remarks'
        ]
