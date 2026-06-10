from django.core.management.base import BaseCommand
from apps.accounts import seeds as accounts_seeds
from apps.commerce import seeds as commerce_seeds
from apps.cashback import seeds as cashback_seeds
from apps.causes import seeds as causes_seeds


class Command(BaseCommand):
    help = "Run project seeds"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding accounts..."))
        accounts_seeds.seed()
        self.stdout.write(self.style.NOTICE("Seeding causes..."))
        causes_seeds.seed()
        self.stdout.write(self.style.NOTICE("Seeding commerce..."))
        commerce_seeds.seed()
        self.stdout.write(self.style.NOTICE("Seeding cashback..."))
        cashback_seeds.seed()
        self.stdout.write(self.style.SUCCESS("Seeds completed."))
