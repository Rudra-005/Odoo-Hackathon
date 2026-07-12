from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Notification

class NotificationListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        # In a real app we'd filter by request.user, but for this demo:
        user = None
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.first()

        if not user:
            return Response([])

        notifications = Notification.objects.filter(user=user).order_by('-created_at')[:20]
        data = [{
            'id': str(n.id),
            'title': n.title,
            'message': n.message,
            'type': n.type,
            'is_read': n.is_read,
            'created_at': n.created_at.isoformat()
        } for n in notifications]
        return Response(data)

class MarkNotificationReadView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk, *args, **kwargs):
        try:
            n = Notification.objects.get(id=pk)
            n.is_read = True
            n.save()
            return Response({'status': 'ok'})
        except Notification.DoesNotExist:
            return Response({'status': 'not found'}, status=404)