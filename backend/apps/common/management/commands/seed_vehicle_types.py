from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Seed data command'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Successfully seeded data'))
