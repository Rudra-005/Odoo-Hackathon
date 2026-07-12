from django.urls import path
from .views import GlobalSearchView, CompanySettingsView

urlpatterns = [
    path('search/', GlobalSearchView.as_view(), name='global-search'),
    path('settings/company/', CompanySettingsView.as_view(), name='company-settings'),
]
