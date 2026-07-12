from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from .selectors import ReportSelector
from .exporters import ExportFactory

class ReportViewSet(viewsets.ViewSet):
    # permission_classes = [IsAuthenticated]

    def _get_filters(self, request):
        return {
            'start_date': request.query_params.get('start_date'),
            'end_date': request.query_params.get('end_date'),
            'vehicle_id': request.query_params.get('vehicle_id'),
            'driver_id': request.query_params.get('driver_id'),
            'status': request.query_params.get('status'),
        }

    @action(detail=False, methods=['get'])
    def fleet(self, request):
        try:
            filters = self._get_filters(request)
            data = ReportSelector.get_fleet_report(filters)
            return Response(data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def financial(self, request):
        try:
            filters = self._get_filters(request)
            data = ReportSelector.get_financial_report(filters)
            return Response(data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def trips(self, request):
        try:
            filters = self._get_filters(request)
            data = ReportSelector.get_trip_report(filters)
            return Response(data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='export/(?P<format_type>[^/.]+)')
    def export(self, request, format_type=None):
        try:
            report_type = request.data.get('report_type', 'fleet')
            filters = request.data.get('filters', {})
            
            # Fetch data based on report type
            if report_type == 'fleet':
                data = ReportSelector.get_fleet_report(filters)['data']
                filename = 'Fleet_Report'
            elif report_type == 'financial':
                data = ReportSelector.get_financial_report(filters)['data']
                filename = 'Financial_Report'
            elif report_type == 'trips':
                data = ReportSelector.get_trip_report(filters)['data']
                filename = 'Trip_Report'
            else:
                return Response({'error': 'Invalid report type'}, status=status.HTTP_400_BAD_REQUEST)

            exporter = ExportFactory.get_exporter(format_type)
            return exporter.export(data, filename)
            
        except ValueError as ve:
            return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
