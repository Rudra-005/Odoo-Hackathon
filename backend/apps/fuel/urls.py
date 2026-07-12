from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FuelLogViewSet

router = DefaultRouter()
router.register(r'', FuelLogViewSet, basename='fuel-log')

urlpatterns = [
    path('', include(router.urls)),
]
