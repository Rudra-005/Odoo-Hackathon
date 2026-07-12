from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Trip
from apps.notifications.models import Notification

@receiver(pre_save, sender=Trip)
def generate_trip_number_and_track_status(sender, instance, **kwargs):
    # Track old status for notifications
    if instance.pk:
        try:
            old_instance = Trip.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except Trip.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None

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

@receiver(post_save, sender=Trip)
def create_trip_notifications(sender, instance, created, **kwargs):
    old_status = getattr(instance, '_old_status', None)
    new_status = instance.status

    if old_status != new_status:
        User = get_user_model()
        user = User.objects.first() # for demo, assign to first user
        if not user: return
        
        if new_status == 'DISPATCHED':
            Notification.objects.create(
                user=user,
                title='Vehicle Dispatched',
                message=f'Vehicle {instance.vehicle.registration_number} and Driver {instance.driver.first_name} have been assigned to trip {instance.trip_number}.',
                type='INFO'
            )
        elif new_status == 'COMPLETED':
            Notification.objects.create(
                user=user,
                title='Trip Completed',
                message=f'Vehicle {instance.vehicle.registration_number} and Driver {instance.driver.first_name} are now available from trip {instance.trip_number}.',
                type='SUCCESS'
            )
