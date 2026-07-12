from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import MaintenanceLog

@receiver(pre_save, sender=MaintenanceLog)
def generate_maintenance_id(sender, instance, **kwargs):
    if not instance.maintenance_id:
        last_log = MaintenanceLog.objects.all().order_by('-created_at').first()
        if last_log and last_log.maintenance_id and last_log.maintenance_id.startswith('MNT-'):
            try:
                sequence = int(last_log.maintenance_id.split('-')[1])
                new_sequence = sequence + 1
            except ValueError:
                new_sequence = 10001
        else:
            new_sequence = 10001
            
        instance.maintenance_id = f"MNT-{new_sequence:05d}"
