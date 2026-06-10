from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from apps.commerce.models import Store
from apps.causes.models import Cause
from .models import Campaign, CampaignStore

User = get_user_model()


def seed():
    cause = Cause.objects.filter(is_active=True).first()
    stores = list(Store.objects.filter(active=True)[:2])
    if not cause or not stores:
        return
    if not Campaign.objects.filter(active=True).exists():
        campaign = Campaign.objects.create(
            name="Campaña Solidaria Demo",
            cause=cause,
            percentage=5.0,
            starts_at=timezone.now() - timedelta(days=1),
            ends_at=timezone.now() + timedelta(days=30),
            active=True,
        )
        for store in stores:
            CampaignStore.objects.get_or_create(campaign=campaign, store=store)
