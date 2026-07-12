class FleetException(Exception):
    """Base exception for all Fleet errors"""
    pass

class VehicleUnavailableException(FleetException):
    pass

class DriverUnavailableException(FleetException):
    pass

class LicenseExpiredException(FleetException):
    pass

class VehicleCapacityExceededException(FleetException):
    pass

class TripAlreadyCompletedException(FleetException):
    pass

class MaintenanceActiveException(FleetException):
    pass

class InvalidStateTransitionException(FleetException):
    pass
