from ..exceptions.core import InvalidStateTransitionException
from ..audit.core import AuditEngine

class StatusEngine:
    @staticmethod
    def _validate_transition(current_state, next_state, allowed_transitions):
        if next_state not in allowed_transitions.get(current_state, []):
            raise InvalidStateTransitionException(
                f"Cannot transition from {current_state} to {next_state}. Allowed: {allowed_transitions.get(current_state)}"
            )

    @staticmethod
    def change_vehicle_status(vehicle, next_state, user):
        transitions = {
            'AVAILABLE': ['ON_TRIP', 'IN_SHOP', 'RETIRED'],
            'ON_TRIP': ['AVAILABLE'],
            'IN_SHOP': ['AVAILABLE', 'RETIRED'],
            'RETIRED': []
        }
        
        old_status = vehicle.status
        StatusEngine._validate_transition(old_status, next_state, transitions)
        
        vehicle.status = next_state
        vehicle.updated_by = user
        vehicle.save(update_fields=['status', 'updated_by'])
        
        AuditEngine.log_action(user, 'STATUS_CHANGE', 'VEHICLE', {'status': old_status}, {'status': next_state})

    @staticmethod
    def change_driver_status(driver, next_state, user):
        transitions = {
            'AVAILABLE': ['ON_TRIP', 'OFF_DUTY', 'SUSPENDED'],
            'ON_TRIP': ['AVAILABLE'],
            'OFF_DUTY': ['AVAILABLE', 'SUSPENDED'],
            'SUSPENDED': ['AVAILABLE']
        }
        
        old_status = driver.status
        StatusEngine._validate_transition(old_status, next_state, transitions)
        
        driver.status = next_state
        driver.updated_by = user
        driver.save(update_fields=['status', 'updated_by'])
        
        AuditEngine.log_action(user, 'STATUS_CHANGE', 'DRIVER', {'status': old_status}, {'status': next_state})

    @staticmethod
    def change_trip_status(trip, next_state, user):
        transitions = {
            'DRAFT': ['DISPATCHED', 'CANCELLED'],
            'DISPATCHED': ['IN_PROGRESS', 'CANCELLED'],
            'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
            'COMPLETED': [],
            'CANCELLED': []
        }
        
        old_status = trip.status
        StatusEngine._validate_transition(old_status, next_state, transitions)
        
        trip.status = next_state
        trip.updated_by = user
        trip.save(update_fields=['status', 'updated_by'])
        
        AuditEngine.log_action(user, 'STATUS_CHANGE', 'TRIP', {'status': old_status}, {'status': next_state})

    @staticmethod
    def change_maintenance_status(log, next_state, user):
        transitions = {
            'SCHEDULED': ['ACTIVE', 'CANCELLED'],
            'ACTIVE': ['COMPLETED', 'CANCELLED'],
            'COMPLETED': [],
            'CANCELLED': []
        }
        
        old_status = log.status
        StatusEngine._validate_transition(old_status, next_state, transitions)
        
        log.status = next_state
        log.updated_by = user
        log.save(update_fields=['status', 'updated_by'])
        
        AuditEngine.log_action(user, 'STATUS_CHANGE', 'MAINTENANCE', {'status': old_status}, {'status': next_state})

    @staticmethod
    def change_expense_status(expense, next_state, user):
        transitions = {
            'PENDING': ['APPROVED', 'REJECTED', 'CANCELLED'],
            'APPROVED': ['PAID', 'CANCELLED'],
            'REJECTED': [],
            'PAID': [],
            'CANCELLED': []
        }
        
        old_status = expense.status
        StatusEngine._validate_transition(old_status, next_state, transitions)
        
        expense.status = next_state
        expense.updated_by = user
        expense.save(update_fields=['status', 'updated_by'])
        
        AuditEngine.log_action(user, 'STATUS_CHANGE', 'EXPENSE', {'status': old_status}, {'status': next_state})
