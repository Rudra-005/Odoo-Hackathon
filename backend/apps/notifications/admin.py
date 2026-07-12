from django.contrib import admin
from apps.common.admin import BaseModelAdmin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(BaseModelAdmin):
    list_display = ('user', 'title', 'type', 'is_read', 'created_at')
    list_filter = ('type', 'is_read', 'created_at')
    search_fields = ('title', 'message', 'user__email', 'user__first_name')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
