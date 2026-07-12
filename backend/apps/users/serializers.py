from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import Role, Permission

User = get_user_model()

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'description']

class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions']

class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'email', 'username', 'phone', 
            'department', 'employee_id', 'profile_photo', 'role', 
            'is_active', 'is_staff', 'is_superuser', 'last_login', 'created_at'
        ]
        read_only_fields = ['id', 'is_active', 'is_staff', 'is_superuser', 'last_login', 'created_at', 'role']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Allow email or username for login
        username = attrs.get(self.username_field)
        password = attrs.get('password')
        
        # Check if it's an email
        if username and '@' in username:
            try:
                user = User.objects.get(email=username)
                attrs[self.username_field] = user.email
            except User.DoesNotExist:
                pass
        elif username:
            try:
                user = User.objects.get(username=username)
                attrs[self.username_field] = user.email
            except User.DoesNotExist:
                pass

        data = super().validate(attrs)
        
        # Add custom claims / user info
        user_data = UserSerializer(self.user).data
        data['user'] = user_data
        
        return data

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Password fields didn't match."})
        return attrs

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Password fields didn't match."})
        return attrs
