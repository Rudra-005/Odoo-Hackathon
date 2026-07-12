from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DefaultUserAdmin
from apps.common.admin import BaseModelAdmin
from .models import User, Role, Permission

@admin.register(Role)
class RoleAdmin(BaseModelAdmin):
    list_display = ('name', 'description')

@admin.register(Permission)
class PermissionAdmin(BaseModelAdmin):
    list_display = ('name', 'description')

@admin.register(User)
class UserAdmin(BaseModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'phone', 'role', 'company', 'is_active')
    list_filter = ('is_active', 'role', 'company')
    search_fields = ('email', 'first_name', 'last_name', 'phone')
    
    fieldsets = (
        ('Personal Info', {'fields': ('email', 'password', 'first_name', 'last_name', 'phone', 'profile_photo')}),
        ('Organization', {'fields': ('role', 'company', 'region')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('role', 'company', 'region')
