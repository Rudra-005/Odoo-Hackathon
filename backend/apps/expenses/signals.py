from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Expense

@receiver(pre_save, sender=Expense)
def generate_expense_id(sender, instance, **kwargs):
    if not instance.expense_number:
        last_expense = Expense.objects.all().order_by('-created_at').first()
        if last_expense and last_expense.expense_number and last_expense.expense_number.startswith('EXP-'):
            try:
                sequence = int(last_expense.expense_number.split('-')[1])
                new_sequence = sequence + 1
            except ValueError:
                new_sequence = 10001
        else:
            new_sequence = 10001
            
        instance.expense_number = f"EXP-{new_sequence:05d}"
