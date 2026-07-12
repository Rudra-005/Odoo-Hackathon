from ..exceptions.core import (
    VehicleUnavailableException, DriverUnavailableException, 
    LicenseExpiredException, VehicleCapacityExceededException,
    MaintenanceActiveException
)

class VehicleValidator:
    @staticmethod
    def check_availability(vehicle):
        if vehicle.status != 'AVAILABLE':
            raise VehicleUnavailableException(f"Vehicle {vehicle.registration_number} is currently {vehicle.status}.")

    @staticmethod
    def check_active_maintenance(vehicle):
        if vehicle.status == 'IN_SHOP':
            raise MaintenanceActiveException(f"Vehicle {vehicle.registration_number} is in maintenance.")
            
    @staticmethod
    def check_capacity(vehicle, weight):
        if vehicle.maximum_load_capacity and weight > vehicle.maximum_load_capacity:
            raise VehicleCapacityExceededException(f"Weight {weight} exceeds vehicle capacity of {vehicle.maximum_load_capacity}.")


class DriverValidator:
    @staticmethod
    def check_availability(driver):
        if driver.status != 'AVAILABLE':
            raise DriverUnavailableException(f"Driver {driver.driver_code} is currently {driver.status}.")

    @staticmethod
    def check_license(driver):
        if not driver.is_license_valid():
            raise LicenseExpiredException(f"Driver {driver.driver_code} has an expired license.")


class TripValidator:
    @staticmethod
    def check_dispatch_readiness(trip):
        # Utilizes sub-validators
        VehicleValidator.check_availability(trip.vehicle)
        VehicleValidator.check_capacity(trip.vehicle, trip.cargo_weight)
        
        DriverValidator.check_availability(trip.driver)
        DriverValidator.check_license(trip.driver)

class MaintenanceValidator:
    @staticmethod
    def check_eligibility(vehicle):
        if vehicle.status == 'RETIRED':
            raise VehicleUnavailableException(f"Vehicle {vehicle.registration_number} is retired and cannot undergo maintenance.")
        if vehicle.status == 'IN_SHOP':
            raise MaintenanceActiveException(f"Vehicle {vehicle.registration_number} is already in the shop.")

class FuelValidator:
    @staticmethod
    def validate_odometer(vehicle, reading):
        if vehicle.current_odometer and reading < vehicle.current_odometer:
            raise FleetException(f"Odometer reading {reading} cannot be less than current odometer {vehicle.current_odometer}.")

    @staticmethod
    def validate_date(date):
        from django.utils import timezone
        if date > timezone.now().date():
            raise FleetException("Fuel date cannot be in the future.")

class ExpenseValidator:
    @staticmethod
    def validate_trip_status(trip):
        if trip and trip.status in ['CANCELLED', 'SCHEDULED']:
            raise FleetException(f"Cannot add expenses to a {trip.status} trip.")

    @staticmethod
    def validate_amounts(amount, tax, discount):
        if amount <= 0:
            raise FleetException("Expense amount must be greater than zero.")
        if tax < 0 or discount < 0:
            raise FleetException("Tax and discount cannot be negative.")

    @staticmethod
    def validate_date(date):
        from django.utils import timezone
        if date > timezone.now().date():
            raise FleetException("Expense date cannot be in the future.")
