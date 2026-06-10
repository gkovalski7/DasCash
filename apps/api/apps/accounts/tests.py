"""
Profile & Donations endpoint tests — real endpoint tests via DRF APIClient.
Covers: GET/PATCH /api/profile/, GET /api/profile/donations/
"""

from decimal import Decimal
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.cashback.models import Campaign, CampaignStore, Purchase, CashbackTransaction
from apps.causes.models import Cause
from apps.commerce.models import Merchant, Store

User = get_user_model()


class ProfileTestCase(TestCase):
    """Shared fixture for profile tests."""

    @classmethod
    def setUpTestData(cls):
        cls.consumer = User.objects.create_user(
            username="p_consumer", email="pc@t.com", password="Pass1234!",
            role="CONSUMER", first_name="Carlos", last_name="Test",
        )
        cls.merchant_user = User.objects.create_user(
            username="p_merchant", email="pm@t.com", password="Pass1234!", role="MERCHANT",
        )
        cls.merchant = Merchant.objects.create(owner=cls.merchant_user, name="PMerch", cuit="20-333-3")
        cls.store = Store.objects.create(
            merchant=cls.merchant, display_name="PStore", qrcode_slug="ps-1", active=True,
        )
        cls.cause = Cause.objects.create(title="Educación Test", slug="educacion-test", category="Educación", is_active=True)
        now = timezone.now()
        cls.campaign = Campaign.objects.create(
            name="Profile Test Campaign", cause=cls.cause, percentage=Decimal("10.00"),
            starts_at=now - timedelta(days=1), ends_at=now + timedelta(days=30), active=True,
        )
        CampaignStore.objects.create(campaign=cls.campaign, store=cls.store)

    def _client_for(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c


# ═══════════════════════════════════════════════════════════════════════════
# G. GET /api/profile/
# ═══════════════════════════════════════════════════════════════════════════
class TestProfileGet(ProfileTestCase):

    def test_unauthenticated_rejected(self):
        resp = APIClient().get("/api/profile/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_basic_fields(self):
        client = self._client_for(self.consumer)
        resp = client.get("/api/profile/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["email"], "pc@t.com")
        self.assertEqual(resp.data["first_name"], "Carlos")
        self.assertEqual(resp.data["role"], "CONSUMER")

    def test_get_computed_fields_empty(self):
        """When user has no purchases, computed fields are zero."""
        client = self._client_for(self.consumer)
        resp = client.get("/api/profile/")
        self.assertEqual(resp.data["total_donated"], "0")
        self.assertEqual(resp.data["causes_count"], 0)
        self.assertEqual(resp.data["purchases_count"], 0)

    def test_get_computed_fields_with_data(self):
        """Computed fields reflect actual DB data."""
        # Create purchase + approve + cashback with a cause
        purchase = Purchase.objects.create(
            user=self.consumer, store=self.store, amount=Decimal("1000"), source="QR",
            status="APPROVED",
        )
        CashbackTransaction.objects.create(
            user=self.consumer, purchase=purchase, cause=self.cause,
            percentage=Decimal("10"), amount=Decimal("100"),
        )

        client = self._client_for(self.consumer)
        resp = client.get("/api/profile/")
        self.assertEqual(Decimal(resp.data["total_donated"]), Decimal("100"))
        self.assertEqual(resp.data["causes_count"], 1)  # 1 distinct cause from transactions
        self.assertEqual(resp.data["purchases_count"], 1)


# ═══════════════════════════════════════════════════════════════════════════
# H. PATCH /api/profile/
# ═══════════════════════════════════════════════════════════════════════════
class TestProfilePatch(ProfileTestCase):

    def test_patch_allowed_fields(self):
        client = self._client_for(self.consumer)
        resp = client.patch("/api/profile/", {"first_name": "Nuevo", "last_name": "Apellido"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["first_name"], "Nuevo")
        self.assertEqual(resp.data["last_name"], "Apellido")

    def test_patch_read_only_fields_ignored(self):
        """email and role are read_only and must not change."""
        client = self._client_for(self.consumer)
        resp = client.patch("/api/profile/", {"email": "hacked@t.com", "role": "ADMIN"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.consumer.refresh_from_db()
        self.assertEqual(self.consumer.email, "pc@t.com")
        self.assertEqual(self.consumer.role, "CONSUMER")


# ═══════════════════════════════════════════════════════════════════════════
# I. GET /api/profile/donations/
# ═══════════════════════════════════════════════════════════════════════════
class TestDonationsGet(ProfileTestCase):

    def test_unauthenticated_rejected(self):
        resp = APIClient().get("/api/profile/donations/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_empty_donations(self):
        client = self._client_for(self.consumer)
        resp = client.get("/api/profile/donations/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data, [])

    def test_donations_with_cause(self):
        """Donations endpoint returns correct shape with cause info."""
        purchase = Purchase.objects.create(
            user=self.consumer, store=self.store, amount=Decimal("500"), source="QR",
            status="APPROVED",
        )
        CashbackTransaction.objects.create(
            user=self.consumer, purchase=purchase, cause=self.cause,
            percentage=Decimal("10"), amount=Decimal("50"),
        )

        client = self._client_for(self.consumer)
        resp = client.get("/api/profile/donations/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

        d = resp.data[0]
        self.assertEqual(d["cause_title"], "Educación Test")
        self.assertEqual(d["cause_slug"], "educacion-test")
        self.assertEqual(Decimal(d["amount"]), Decimal("50.00"))
        self.assertEqual(d["store_name"], "PStore")
        self.assertEqual(Decimal(d["purchase_amount"]), Decimal("500.00"))

    def test_donations_without_cause(self):
        """Donations with cause=None should show fallback title."""
        purchase = Purchase.objects.create(
            user=self.consumer, store=self.store, amount=Decimal("300"), source="LINK",
            status="APPROVED",
        )
        CashbackTransaction.objects.create(
            user=self.consumer, purchase=purchase, cause=None,
            percentage=Decimal("10"), amount=Decimal("30"),
        )

        client = self._client_for(self.consumer)
        resp = client.get("/api/profile/donations/")
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["cause_title"], "Sin causa asignada")
        self.assertIsNone(resp.data[0]["cause_slug"])

    def test_donations_isolated_per_user(self):
        """User only sees their own donations, not other users'."""
        purchase = Purchase.objects.create(
            user=self.consumer, store=self.store, amount=Decimal("200"), source="QR",
            status="APPROVED",
        )
        CashbackTransaction.objects.create(
            user=self.consumer, purchase=purchase, cause=self.cause,
            percentage=Decimal("10"), amount=Decimal("20"),
        )

        # merchant_user should see empty donations
        client = self._client_for(self.merchant_user)
        resp = client.get("/api/profile/donations/")
        self.assertEqual(len(resp.data), 0)
