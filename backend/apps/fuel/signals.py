from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import FuelLog

@receiver(pre_save, sender=FuelLog)
def generate_fuel_id(sender, instance, **kwargs):
    if not instance.fuel_log_number:
        last_log = FuelLog.objects.all().order_by('-created_at').first()
        if last_log and last_log.fuel_log_number and last_log.fuel_log_number.startswith('FUEL-'):
            try:
                sequence = int(last_log.fuel_log_number.split('-')[1])
                new_sequence = sequence + 1
            except ValueError:
                new_sequence = 10001
        else:
            new_sequence = 10001
            
        instance.fuel_log_number = f"FUEL-{new_sequence:05d}"
