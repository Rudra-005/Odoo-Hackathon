from apps.common.models import AuditLog

class AuditEngine:
    @staticmethod
    def log_action(user, action: str, module: str, old_value: dict = None, new_value: dict = None, ip_address: str = None):
        """
        Creates a central audit log record.
        """
        AuditLog.objects.create(
            user=user,
            action=action,
            module=module,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address
        )
