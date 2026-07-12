from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Trip

@receiver(pre_save, sender=Trip)
def generate_trip_number(sender, instance, **kwargs):
    if not instance.trip_number:
        last_trip = Trip.objects.all().order_by('-created_at').first()
        if last_trip and last_trip.trip_number and last_trip.trip_number.startswith('TRP-'):
            try:
                sequence = int(last_trip.trip_number.split('-')[1])
                new_sequence = sequence + 1
            except ValueError:
                new_sequence = 10001
        else:
            new_sequence = 10001
            
        instance.trip_number = f"TRP-{new_sequence:05d}"
