import logging
from ..notifications.core import NotificationEngine

logger = logging.getLogger(__name__)

class EventEngine:
    """
    Central Pub/Sub Event Bus.
    Instead of using Django Signals for business logic, services emit events here,
    which asynchronously trigger side effects like Notifications and Dashboard Updates.
    """
    
    _handlers = {
        'TripCreated': [NotificationEngine.notify_trip_created],
        'TripDispatched': [NotificationEngine.notify_trip_dispatched],
        'TripCompleted': [NotificationEngine.notify_trip_completed],
        'TripCancelled': [NotificationEngine.notify_trip_cancelled],
        'MaintenanceStarted': [NotificationEngine.notify_vehicle_maintenance],
        'DriverSuspended': [NotificationEngine.notify_driver_suspended],
        'VehicleRetired': [NotificationEngine.notify_vehicle_retired],
    }

    # Lazy import to avoid circular dependencies
    @classmethod
    def get_handlers(cls):
        from apps.expenses.integration import ExpenseIntegration
        
        # Merge static handlers with dynamic ones
        handlers = cls._handlers.copy()
        handlers['FuelLogCreated'] = [ExpenseIntegration.create_expense_from_fuel]
        handlers['MaintenanceCompleted'] = [NotificationEngine.notify_vehicle_maintenance, ExpenseIntegration.create_expense_from_maintenance]
        return handlers

    @staticmethod
    def emit(event_name: str, **kwargs):
        logger.info(f"[EVENT] Emitting {event_name}")
        handlers = EventEngine.get_handlers().get(event_name, [])
        for handler in handlers:
            try:
                # Assuming handlers accept **kwargs corresponding to the models
                if 'trip' in kwargs and 'trip' in handler.__code__.co_varnames:
                    handler(trip=kwargs['trip'])
                elif 'vehicle' in kwargs and 'vehicle' in handler.__code__.co_varnames:
                    handler(vehicle=kwargs['vehicle'])
                elif 'driver' in kwargs and 'driver' in handler.__code__.co_varnames:
                    handler(driver=kwargs['driver'])
                elif 'fuel_log' in kwargs and 'fuel_log' in handler.__code__.co_varnames:
                    handler(fuel_log=kwargs['fuel_log'])
                elif 'log' in kwargs and 'log' in handler.__code__.co_varnames:
                    handler(log=kwargs['log'])
                else:
                    handler(**kwargs)
            except Exception as e:
                logger.error(f"[EVENT] Handler {handler.__name__} failed on {event_name}: {str(e)}")
