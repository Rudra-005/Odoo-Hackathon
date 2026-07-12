from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

api_v1_patterns = [
    path('common/', include('apps.common.urls')),
    path('auth/', include('apps.users.urls')),
    path('users/', include('apps.users.urls')),
    path('vehicles/', include('apps.vehicles.urls')),
    path('drivers/', include('apps.drivers.urls')),
    path('trips/', include('apps.trips.urls')),
    path('maintenance/', include('apps.maintenance.urls')),
    path('fuel/', include('apps.fuel.urls')),
    path('expenses/', include('apps.expenses.urls')),
    path('dashboard/', include('apps.dashboard.urls')),
    path('reports/', include('apps.reports.urls')),
    path('analytics/', include('apps.analytics.urls')),
    path('notifications/', include('apps.notifications.urls')),
    path('chatbot/', include('apps.chatbot.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Routing
    path('api/v1/', include(api_v1_patterns)),
    
    # OpenAPI Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
