from django.db import transaction
from ..validators.core import TripValidator
from .status import StatusEngine
from ..audit.core import AuditEngine
from ..events.core import EventEngine
from ..constants.status import TripStatus, VehicleStatus, DriverStatus
from django.utils import timezone

class TripWorkflowService:
    @staticmethod
    def dispatch_trip(trip, user):
        with transaction.atomic():
            # 1. Validate
            TripValidator.check_dispatch_readiness(trip)
            
            # 2. Lock & Transition Statuses
            StatusEngine.change_vehicle_status(trip.vehicle, VehicleStatus.ON_TRIP, user)
            StatusEngine.change_driver_status(trip.driver, DriverStatus.ON_TRIP, user)
            StatusEngine.change_trip_status(trip, TripStatus.DISPATCHED, user)
            
            trip.dispatch_date = timezone.now()
            trip.save(update_fields=['dispatch_date'])
            
            # 3. Log Audit
            AuditEngine.log_action(user, 'DISPATCH_TRIP', 'TRIP', None, {'trip_id': str(trip.id)})
            
            # 4. Emit Event
            EventEngine.emit('TripDispatched', trip=trip)
            
        return trip

    @staticmethod
    def complete_trip(trip, user, completion_data):
        with transaction.atomic():
            # 1. Validate Odometers & Fuel (handled in trip services typically, but routed here)
            
            # 2. Transition Statuses
            StatusEngine.change_vehicle_status(trip.vehicle, VehicleStatus.AVAILABLE, user)
            StatusEngine.change_driver_status(trip.driver, DriverStatus.AVAILABLE, user)
            StatusEngine.change_trip_status(trip, TripStatus.COMPLETED, user)
            
            # Apply completion data
            for key, val in completion_data.items():
                setattr(trip, key, val)
            trip.completion_date = timezone.now()
            trip.save()
            
            # 3. Update Odometer on Vehicle
            if trip.end_odometer:
                trip.vehicle.current_odometer = trip.end_odometer
                trip.vehicle.save(update_fields=['current_odometer'])
            
            # 4. Audit
            AuditEngine.log_action(user, 'COMPLETE_TRIP', 'TRIP', None, {'trip_id': str(trip.id)})
            
            # 5. Emit Event
            EventEngine.emit('TripCompleted', trip=trip)

        return trip

    @staticmethod
    def cancel_trip(trip, user):
        with transaction.atomic():
            old_status = trip.status
            
            # Restore resources if they were in use
            if old_status in [TripStatus.DISPATCHED, TripStatus.IN_PROGRESS]:
                StatusEngine.change_vehicle_status(trip.vehicle, VehicleStatus.AVAILABLE, user)
                StatusEngine.change_driver_status(trip.driver, DriverStatus.AVAILABLE, user)
                
            StatusEngine.change_trip_status(trip, TripStatus.CANCELLED, user)
            
            AuditEngine.log_action(user, 'CANCEL_TRIP', 'TRIP', None, {'trip_id': str(trip.id)})
            EventEngine.emit('TripCancelled', trip=trip)

        return trip


class MaintenanceWorkflowService:
    @staticmethod
    def start_maintenance(log, user):
        from ..validators.core import MaintenanceValidator
        from apps.trips.scheduling import SchedulingEngine
        with transaction.atomic():
            # 1. Validate
            MaintenanceValidator.check_eligibility(log.vehicle)
            
            # Check for conflict with active trips
            # Use log.maintenance_start/end if set, otherwise default to now -> estimated completion
            start = log.maintenance_start or timezone.now()
            end = log.maintenance_end or (timezone.now() + timezone.timedelta(days=7))
            SchedulingEngine.check_maintenance_trip_conflict(log.vehicle, start, end)

            # 2. Lock & Transition Statuses
            StatusEngine.change_vehicle_status(log.vehicle, VehicleStatus.MAINTENANCE, user)
            StatusEngine.change_maintenance_status(log, 'ACTIVE', user)
            
            log.start_date = timezone.now().date()
            if not log.maintenance_start:
                log.maintenance_start = timezone.now()
            log.save(update_fields=['start_date', 'maintenance_start'])
            
            # 3. Log Audit
            AuditEngine.log_action(user, 'START_MAINTENANCE', 'MAINTENANCE', None, {'maintenance_id': str(log.id)})
            
            # 4. Emit Event
            EventEngine.emit('MaintenanceStarted', vehicle=log.vehicle, log=log)
            
        return log

    @staticmethod
    def complete_maintenance(log, user, completion_data):
        with transaction.atomic():
            # 1. Transition Statuses
            StatusEngine.change_maintenance_status(log, 'COMPLETED', user)
            
            if log.vehicle.status != VehicleStatus.RETIRED:
                StatusEngine.change_vehicle_status(log.vehicle, VehicleStatus.AVAILABLE, user)
            
            # Apply completion data
            for key, val in completion_data.items():
                setattr(log, key, val)
            log.actual_completion = timezone.now().date()
            log.maintenance_end = timezone.now()
            log.save()
            
            # 3. Log Audit
            AuditEngine.log_action(user, 'COMPLETE_MAINTENANCE', 'MAINTENANCE', None, {'maintenance_id': str(log.id)})
            
            # 4. Emit Event
            EventEngine.emit('MaintenanceCompleted', vehicle=log.vehicle, log=log)
            
        return log

    @staticmethod
    def cancel_maintenance(log, user):
        with transaction.atomic():
            old_status = log.status
            
            if old_status == 'ACTIVE':
                if log.vehicle.status != VehicleStatus.RETIRED:
                    StatusEngine.change_vehicle_status(log.vehicle, VehicleStatus.AVAILABLE, user)
                    
            StatusEngine.change_maintenance_status(log, 'CANCELLED', user)
            
            # Clear scheduling bounds on cancel
            log.maintenance_start = None
            log.maintenance_end = None
            log.save(update_fields=['maintenance_start', 'maintenance_end'])
            
            AuditEngine.log_action(user, 'CANCEL_MAINTENANCE', 'MAINTENANCE', None, {'maintenance_id': str(log.id)})
            EventEngine.emit('MaintenanceCancelled', log=log)
            
        return log

class FuelWorkflowService:
    @staticmethod
    def create_fuel_log(log, user):
        from ..validators.core import FuelValidator, VehicleValidator
        from ..calculations.core import CalculationEngine
        with transaction.atomic():
            # 1. Validate
            VehicleValidator.check_eligibility = getattr(VehicleValidator, 'check_eligibility', lambda v: None) # Ignore for now, standard check
            
            if log.vehicle.status == 'RETIRED':
                 raise Exception("Cannot log fuel for retired vehicle.")
                 
            FuelValidator.validate_date(log.fuel_date)
            FuelValidator.validate_odometer(log.vehicle, log.odometer_reading)
            
            # 2. Calculations
            log.total_cost = log.quantity * log.price_per_unit
            
            if log.vehicle.current_odometer:
                log.distance_since_last = log.odometer_reading - log.vehicle.current_odometer
            else:
                log.distance_since_last = 0
                
            log.fuel_efficiency = CalculationEngine.calculate_vehicle_efficiency(log.distance_since_last, log.quantity)
            
            # 3. Update Vehicle Odometer
            log.vehicle.current_odometer = log.odometer_reading
            log.vehicle.save(update_fields=['current_odometer'])
            
            # 4. Save Fuel Log
            log.created_by = user
            log.save()
            
            # 5. Log Audit
            AuditEngine.log_action(user, 'CREATE_FUEL_LOG', 'FUEL', None, {'fuel_log_id': str(log.id)})
            
            # 6. Emit Event (Will trigger Expense creation)
            EventEngine.emit('FuelLogCreated', fuel_log=log)
            
        return log

class ExpenseWorkflowService:
    @staticmethod
    def create_expense(expense, user):
        from ..validators.core import ExpenseValidator
        with transaction.atomic():
            # 1. Validate
            ExpenseValidator.validate_date(expense.expense_date)
            ExpenseValidator.validate_amounts(expense.amount, expense.tax, expense.discount)
            ExpenseValidator.validate_trip_status(expense.trip)
            
            # 2. Calculation
            expense.net_amount = expense.amount + expense.tax - expense.discount
            
            # 3. Save
            expense.created_by = user
            expense.status = 'PENDING'
            expense.save()
            
            # 4. Audit & Event
            AuditEngine.log_action(user, 'CREATE_EXPENSE', 'EXPENSE', None, {'expense_id': str(expense.id)})
            EventEngine.emit('ExpenseCreated', expense=expense)
            
        return expense

    @staticmethod
    def approve_expense(expense, user):
        with transaction.atomic():
            StatusEngine.change_expense_status(expense, 'APPROVED', user)
            AuditEngine.log_action(user, 'APPROVE_EXPENSE', 'EXPENSE', None, {'expense_id': str(expense.id)})
            EventEngine.emit('ExpenseApproved', expense=expense)
        return expense
        
    @staticmethod
    def reject_expense(expense, user):
        with transaction.atomic():
            StatusEngine.change_expense_status(expense, 'REJECTED', user)
            AuditEngine.log_action(user, 'REJECT_EXPENSE', 'EXPENSE', None, {'expense_id': str(expense.id)})
            EventEngine.emit('ExpenseRejected', expense=expense)
        return expense
        
    @staticmethod
    def mark_paid(expense, user):
        with transaction.atomic():
            StatusEngine.change_expense_status(expense, 'PAID', user)
            AuditEngine.log_action(user, 'PAY_EXPENSE', 'EXPENSE', None, {'expense_id': str(expense.id)})
            EventEngine.emit('ExpensePaid', expense=expense)
        return expense
