from rest_framework import permissions

class HasRole(permissions.BasePermission):
    """
    Base class to check if a user has a specific role.
    """
    role_name = None

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Superusers bypass role checks
        if request.user.is_superuser:
            return True
            
        if request.user.role and request.user.role.name == self.role_name:
            return True
            
        return False


class IsSuperAdmin(HasRole):
    role_name = 'Super Admin'
    
    def has_permission(self, request, view):
        if request.user and request.user.is_superuser:
            return True
        return super().has_permission(request, view)


class IsAdmin(HasRole):
    role_name = 'Admin'


class IsFleetManager(HasRole):
    role_name = 'Fleet Manager'


class IsDispatcher(HasRole):
    role_name = 'Dispatcher'


class IsDriver(HasRole):
    role_name = 'Driver'


class IsSafetyOfficer(HasRole):
    role_name = 'Safety Officer'


class IsFinancialAnalyst(HasRole):
    role_name = 'Financial Analyst'


class IsViewer(HasRole):
    role_name = 'Viewer'


# Custom permission checks based on granular permissions (if they exist on the role)
class HasPermission(permissions.BasePermission):
    required_permission = None
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        if request.user.is_superuser:
            return True
            
        if request.user.role:
            # Assuming Role has a ManyToManyField to Permission
            return request.user.role.permissions.filter(name=self.required_permission).exists()
            
        return False

# Examples of granular permissions
class CanCreateVehicle(HasPermission):
    required_permission = 'CanCreateVehicle'

class CanEditVehicle(HasPermission):
    required_permission = 'CanEditVehicle'

class CanDeleteVehicle(HasPermission):
    required_permission = 'CanDeleteVehicle'

class CanDispatchTrip(HasPermission):
    required_permission = 'CanDispatchTrip'

class CanApproveMaintenance(HasPermission):
    required_permission = 'CanApproveMaintenance'

class CanManageExpenses(HasPermission):
    required_permission = 'CanManageExpenses'

class CanViewReports(HasPermission):
    required_permission = 'CanViewReports'

class CanManageUsers(HasPermission):
    required_permission = 'CanManageUsers'

class CanManageRoles(HasPermission):
    required_permission = 'CanManageRoles'
