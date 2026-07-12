from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaintenanceTypeViewSet, MaintenanceLogViewSet

router = DefaultRouter()
router.register(r'types', MaintenanceTypeViewSet, basename='maintenance-type')
router.register(r'', MaintenanceLogViewSet, basename='maintenance-log')

urlpatterns = [
    path('', include(router.urls)),
]
