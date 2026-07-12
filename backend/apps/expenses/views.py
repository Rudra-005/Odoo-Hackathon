from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ExpenseCategory, Expense
from .serializers import (
    ExpenseCategorySerializer, ExpenseSerializer, ExpenseWriteSerializer
)
from apps.common.workflow.orchestrators import ExpenseWorkflowService

class ExpenseCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer

class ExpenseViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return Expense.objects.all().select_related(
            'vehicle', 'trip', 'category', 'driver'
        ).order_by('-expense_date', '-created_at')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ExpenseWriteSerializer
        return ExpenseSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        expense = Expense(**serializer.validated_data)
        
        from apps.common.models import Company
        expense.company = Company.objects.first()
        
        try:
            expense = ExpenseWorkflowService.create_expense(expense, request.user)
            return Response(ExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        expense = self.get_object()
        try:
            ExpenseWorkflowService.approve_expense(expense, request.user)
            return Response(self.get_serializer(expense).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        expense = self.get_object()
        try:
            ExpenseWorkflowService.reject_expense(expense, request.user)
            return Response(self.get_serializer(expense).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='mark-paid')
    def mark_paid(self, request, pk=None):
        expense = self.get_object()
        try:
            ExpenseWorkflowService.mark_paid(expense, request.user)
            return Response(self.get_serializer(expense).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
