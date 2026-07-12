from apps.expenses.models import Expense, ExpenseCategory

class ExpenseIntegration:
    @staticmethod
    def create_expense_from_fuel(fuel_log):
        # Find or create a 'Fuel' category
        category, _ = ExpenseCategory.objects.get_or_create(
            name='FUEL',
            defaults={'description': 'Auto-generated fuel expenses'}
        )
        
        description = f"Fuel for {fuel_log.vehicle.registration_number} ({fuel_log.quantity}L at {fuel_log.price_per_unit})"
        if fuel_log.fuel_station:
            description += f" at {fuel_log.fuel_station}"
            
        Expense.objects.create(
            company=fuel_log.company,
            vehicle=fuel_log.vehicle,
            trip=fuel_log.trip,
            category=category,
            amount=fuel_log.total_cost,
            net_amount=fuel_log.total_cost,
            expense_date=fuel_log.fuel_date,
            description=description,
            attachment=fuel_log.invoice_upload,
            created_by=fuel_log.created_by,
            updated_by=fuel_log.updated_by
        )

    @staticmethod
    def create_expense_from_maintenance(log, **kwargs):
        category, _ = ExpenseCategory.objects.get_or_create(
            name='MAINTENANCE',
            defaults={'description': 'Auto-generated maintenance expenses'}
        )
        
        description = f"Maintenance for {log.vehicle.registration_number}: {log.maintenance_type.get_name_display()}"
        if log.vendor:
            description += f" at {log.vendor}"
            
        Expense.objects.create(
            company=log.company,
            vehicle=log.vehicle,
            category=category,
            amount=log.actual_cost,
            net_amount=log.actual_cost,
            expense_date=log.actual_completion or log.start_date,
            description=description,
            vendor=log.vendor,
            vendor_contact=log.mechanic_contact,
            invoice_number=log.invoice_number,
            invoice_upload=log.invoice_upload,
            status='APPROVED', # Automatically approved if maintenance is completed
            created_by=log.updated_by,
            updated_by=log.updated_by
        )
