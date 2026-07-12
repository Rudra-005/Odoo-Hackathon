from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Driver

@receiver(pre_save, sender=Driver)
def generate_driver_code(sender, instance, **kwargs):
    if not instance.driver_code:
        # Get the latest driver to calculate the next sequence number
        last_driver = Driver.objects.all().order_by('-created_at').first()
        if last_driver and last_driver.driver_code and last_driver.driver_code.startswith('DRV-'):
            try:
                sequence = int(last_driver.driver_code.split('-')[1])
                new_sequence = sequence + 1
            except ValueError:
                new_sequence = 1001
        else:
            new_sequence = 1001
            
        instance.driver_code = f"DRV-{new_sequence:04d}"
