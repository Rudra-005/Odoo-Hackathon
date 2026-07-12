import logging

logger = logging.getLogger(__name__)

class NotificationEngine:
    @staticmethod
    def notify_trip_created(trip):
        # Placeholder for external Email/SMS/Push notifications
        logger.info(f"[NOTIFICATION] Trip {trip.trip_number} created.")

    @staticmethod
    def notify_trip_dispatched(trip):
        logger.info(f"[NOTIFICATION] Trip {trip.trip_number} dispatched.")

    @staticmethod
    def notify_trip_completed(trip):
        logger.info(f"[NOTIFICATION] Trip {trip.trip_number} completed.")
        
    @staticmethod
    def notify_trip_cancelled(trip):
        logger.info(f"[NOTIFICATION] Trip {trip.trip_number} cancelled.")

    @staticmethod
    def notify_vehicle_maintenance(vehicle):
        logger.info(f"[NOTIFICATION] Vehicle {vehicle.registration_number} scheduled for maintenance.")

    @staticmethod
    def notify_license_expiry(driver):
        logger.info(f"[NOTIFICATION] Driver {driver.driver_code} license is expiring soon.")

    @staticmethod
    def notify_driver_suspended(driver):
        logger.warning(f"[NOTIFICATION] ALERT: Driver {driver.driver_code} suspended.")

    @staticmethod
    def notify_vehicle_retired(vehicle):
        logger.info(f"[NOTIFICATION] Vehicle {vehicle.registration_number} retired from fleet.")
