from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from .selectors import DashboardSelector

class DashboardViewSet(viewsets.ViewSet):
    # permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        try:
            data = DashboardSelector.get_summary()
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback; traceback.print_exc(); return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def kpis(self, request):
        try:
            data = DashboardSelector.get_kpis()
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback; traceback.print_exc(); return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def charts(self, request):
        try:
            data = DashboardSelector.get_charts()
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback; traceback.print_exc(); return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        try:
            data = DashboardSelector.get_recent_activity()
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback; traceback.print_exc(); return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

