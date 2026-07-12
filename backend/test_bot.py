import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.chatbot.context import get_fleet_context
try:
    print(get_fleet_context())
except Exception as e:
    import traceback
    traceback.print_exc()
