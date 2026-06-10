"""
Phase 1+2 corrective tests — real endpoint tests via DRF APIClient.
Covers: A (status bypass), B (approve flow), D (inactive cause),
        E (ownership), F (campaign ownership), SC (selected_cause validation).
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
from apps.commerce.models import Merchant, Store, StoreSupportedCause

User = get_user_model()


class BaseTestCase(TestCase):
    """Shared fixture: users, merchant, store, campaign, causes."""

    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_superuser(
            username="t_admin", email="ta@t.com", password="Pass1234!", role="ADMIN"
        )
        cls.merchant_user = User.objects.create_user(
            username="t_merchant", email="tm@t.com", password="Pass1234!", role="MERCHANT"
        )
        cls.merchant_user2 = User.objects.create_user(
            username="t_merchant2", email="tm2@t.com", password="Pass1234!", role="MERCHANT"
        )
        cls.consumer = User.objects.create_user(
            username="t_consumer", email="tc@t.com", password="Pass1234!", role="CONSUMER"
        )
        cls.consumer2 = User.objects.create_user(
            username="t_consumer2", email="tc2@t.com", password="Pass1234!", role="CONSUMER"
        )

        cls.merchant = Merchant.objects.create(owner=cls.merchant_user, name="TestMerch", cuit="20-111-1")
        cls.merchant2 = Merchant.objects.create(owner=cls.merchant_user2, name="TestMerch2", cuit="20-222-2")

        cls.store = Store.objects.create(
            merchant=cls.merchant, display_name="TestStore", qrcode_slug="ts-1", active=True
        )
        cls.store2 = Store.objects.create(
            merchant=cls.merchant2, display_name="TestStore2", qrcode_slug="ts-2", active=True
        )

        cls.cause_a = Cause.objects.create(title="CauseA", category="Educación", is_active=True)
        cls.cause_b = Cause.objects.create(title="CauseB", category="Salud", is_active=True)
        cls.cause_inactive = Cause.objects.create(title="CauseInactive", category="Ambiente", is_active=False)

        now = timezone.now()
        cls.campaign = Campaign.objects.create(
            name="Test Campaign", cause=cls.cause_a, percentage=Decimal("10.00"),
            starts_at=now - timedelta(days=1), ends_at=now + timedelta(days=30), active=True,
        )
        CampaignStore.objects.create(campaign=cls.campaign, store=cls.store)

    def _client_for(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c


# ═══════════════════════════════════════════════════════════════════════════
# A. Purchase.status must not be changeable via PUT/PATCH
# ═══════════════════════════════════════════════════════════════════════════
class TestPurchaseStatusBypass(BaseTestCase):

    def test_patch_status_is_ignored(self):
        """PATCH Purchase with status=APPROVED must NOT change the status."""
        purchase = Purchase.objects.create(
            user=self.consumer, store=self.store, amount=Decimal("500"), source="QR"
        )
        client = self._client_for(self.consumer)
        resp = client.patch(
            f"/api/cashback/purchases/{purchase.pk}/",
            {"status": "APPROVED"},
            format="json",
        )
        purchase.refresh_from_db()
        self.assertEqual(purchase.status, "PENDING", "status should still be PENDING — read_only")

    def test_put_status_is_ignored(self):
        """Full PUT with status=APPROVED must NOT change the status."""
        purchase = Purchase.objects.create(
            user=self.consumer, store=self.store, amount=Decimal("500"), source="QR"
        )
        client = self._client_for(self.consumer)
        resp = client.put(
            f"/api/cashback/purchases/{purchase.pk}/",
            {"store": self.store.pk, "amount": "500.00", "source": "QR", "status": "APPROVED"},
            format="json",
        )
        purchase.refresh_from_db()
        self.assertEqual(purchase.status, "PENDING", "status should still be PENDING — read_only")


# ═══════════════════════════════════════════════════════════════════════════
# B. Real approve endpoint (Phase 2: 1 tx per purchase, uses selected_cause)
# ═══════════════════════════════════════════════════════════════════════════
class TestApproveEndpoint(BaseTestCase):

    def test_approve_with_campaign_cause(self):
        """B.1: approve creates exactly 1 CashbackTransaction with campaign's cause."""
        purchase = Purchase.objects.create(
            user=self.consumer, store=self.store, amount=Decimal("1000"), source="QR",
        )
        client = self._client_for(self.merchant_user)
        resp = client.post(f"/api/cashback/purchases/{purchase.pk}/approve/")

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data["cashback_generated"])
        self.assertEqual(resp.data["transactions_count"], 1)
        self.assertEqual(resp.data["cashback_total"], "100.00")
        self.assertEqual(resp.data["cause"], "CauseA")

        purchase.refresh_from_db()
        self.assertEqual(purchase.status, "APPROVED")

        txs = CashbackTransaction.objects.filter(purchase=purchase)
        self.assertEqual(txs.count(), 1)
        tx = txs.first()
        self.assertEqual(tx.cause, self.cause_a)
        self.assertEqual(tx.campaign, self.campaign)
        self.assertEqual(tx.amount, Decimal("100.00"))

    def test_approve_uses_campaign_cause(self):
        """B.2: approve with selected_cause=None uses campaign's cause."""
        purchase = Purchase.objects.create(
            user=self.consumer2, store=self.store, amount=Decimal("500"), source="LINK",
            selected_cause=None,
        )
        client = self._client_for(self.merchant_user)
        resp = client.post(f"/api/cashback/purchases/{purchase.pk}/approve/")

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data["cashback_generated"])
        self.assertEqual(resp.data["transactions_count"], 1)
        self.assertEqual(resp.data["cause"], "CauseA")

        tx = CashbackTransaction.objects.get(purchase=purchase)
        self.assertEqual(tx.cause, self.cause_a)
        self.assertEqual(tx.amount, Decimal("50.00"))

    def test_approve_deduplication(self):
        """B.3: calling approve twice returns 400/409."""
        purchase = Purchase.objects.create(
            user=self.consumer2, store=self.store, amount=Decimal("200"), source="QR"
        )
        client = self._client_for(self.merchant_user)

        resp1 = client.post(f"/api/cashback/purchases/{purchase.pk}/approve/")
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)

        resp2 = client.post(f"/api/cashback/purchases/{purchase.pk}/approve/")
        self.assertIn(resp2.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_409_CONFLICT])

    def test_approve_no_campaign(self):
        """B.4: approve with no active campaign sets APPROVED but no cashback."""
        purchase = Purchase.objects.create(
            user=self.consumer, store=self.store2, amount=Decimal("100"), source="QR"
        )
        client = self._client_for(self.admin)
        resp = client.post(f"/api/cashback/purchases/{purchase.pk}/approve/")

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(resp.data["cashback_generated"])
        purchase.refresh_from_db()
        self.assertEqual(purchase.status, "APPROVED")
        self.assertEqual(CashbackTransaction.objects.filter(purchase=purchase).count(), 0)

    def test_approve_rejected_for_consumer(self):
        """B.5: consumer cannot approve purchases."""
        purchase = Purchase.objects.create(
            user=self.consumer, store=self.store, amount=Decimal("100"), source="QR"
        )
        client = self._client_for(self.consumer)
        resp = client.post(f"/api/cashback/purchases/{purchase.pk}/approve/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


# ═══════════════════════════════════════════════════════════════════════════
# E. Approve ownership
# ═══════════════════════════════════════════════════════════════════════════
class TestApproveOwnership(BaseTestCase):

    def test_merchant_can_approve_own_store_purchase(self):
        purchase = Purchase.objects.create(
            user=self.consumer, store=self.store, amount=Decimal("100"), source="QR"
        )
        client = self._client_for(self.merchant_user)
        resp = client.post(f"/api/cashback/purchases/{purchase.pk}/approve/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_merchant_cannot_approve_other_store_purchase(self):
        """merchant_user2 owns store2, should not see/approve purchases in store (owned by merchant_user)."""
        purchase = Purchase.objects.create(
            user=self.consumer, store=self.store, amount=Decimal("100"), source="QR"
        )
        client = self._client_for(self.merchant_user2)
        resp = client.post(f"/api/cashback/purchases/{purchase.pk}/approve/")
        # get_queryset filters by merchant ownership, so 404
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_approve_any_purchase(self):
        purchase = Purchase.objects.create(
            user=self.consumer, store=self.store2, amount=Decimal("100"), source="QR"
        )
        client = self._client_for(self.admin)
        resp = client.post(f"/api/cashback/purchases/{purchase.pk}/approve/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


# ═══════════════════════════════════════════════════════════════════════════
# F. Campaign ownership validation
# ═══════════════════════════════════════════════════════════════════════════
class TestCampaignOwnership(BaseTestCase):

    def test_admin_creates_campaign_with_stores(self):
        """Admin can create a campaign with cause and stores."""
        client = self._client_for(self.admin)
        now = timezone.now()
        resp = client.post("/api/cashback/campaigns/", {
            "name": "New Campaign",
            "cause": self.cause_a.pk,
            "store_ids": [self.store2.pk],
            "percentage": "5.00",
            "starts_at": (now - timedelta(days=1)).isoformat(),
            "ends_at": (now + timedelta(days=10)).isoformat(),
            "active": True,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_merchant_cannot_create_campaign(self):
        """Merchant cannot create campaigns (admin only)."""
        client = self._client_for(self.merchant_user)
        now = timezone.now()
        resp = client.post("/api/cashback/campaigns/", {
            "name": "Merch Campaign",
            "cause": self.cause_a.pk,
            "store_ids": [self.store.pk],
            "percentage": "5.00",
            "starts_at": (now - timedelta(days=1)).isoformat(),
            "ends_at": (now + timedelta(days=10)).isoformat(),
            "active": True,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_merchant_list_only_own_campaigns(self):
        """Merchant only sees campaigns for their own stores."""
        client = self._client_for(self.merchant_user2)
        resp = client.get("/api/cashback/campaigns/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # merchant_user2 has no campaigns; the fixture campaign belongs to merchant_user
        self.assertEqual(len(resp.data), 0)

    def test_admin_creates_campaign_multiple_stores(self):
        """Admin can create campaigns with multiple stores."""
        client = self._client_for(self.admin)
        now = timezone.now()
        resp = client.post("/api/cashback/campaigns/", {
            "name": "Multi Store Campaign",
            "cause": self.cause_b.pk,
            "store_ids": [self.store.pk, self.store2.pk],
            "percentage": "8.00",
            "starts_at": (now + timedelta(days=60)).isoformat(),
            "ends_at": (now + timedelta(days=90)).isoformat(),
            "active": True,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(resp.data["campaign_stores"]), 2)

    def test_consumer_cannot_create_campaign(self):
        """Consumer cannot create campaigns."""
        client = self._client_for(self.consumer)
        now = timezone.now()
        resp = client.post("/api/cashback/campaigns/", {
            "name": "Consumer Campaign",
            "cause": self.cause_a.pk,
            "store_ids": [self.store.pk],
            "percentage": "5.00",
            "starts_at": (now - timedelta(days=1)).isoformat(),
            "ends_at": (now + timedelta(days=10)).isoformat(),
            "active": True,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


# ═══════════════════════════════════════════════════════════════════════════
# SC. selected_cause validation on Purchase creation
# ═══════════════════════════════════════════════════════════════════════════
class TestSelectedCauseValidation(BaseTestCase):

    def test_store_zero_causes_allows_null(self):
        """SC1: Store with 0 supported causes → selected_cause=null is OK."""
        client = self._client_for(self.consumer)
        resp = client.post("/api/cashback/purchases/", {
            "store": self.store.pk,
            "amount": "100.00",
            "source": "QR",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(resp.data["selected_cause"])

    def test_store_zero_causes_rejects_cause(self):
        """SC2: Store with 0 causes → sending a cause is rejected."""
        client = self._client_for(self.consumer)
        resp = client.post("/api/cashback/purchases/", {
            "store": self.store.pk,
            "amount": "100.00",
            "source": "QR",
            "selected_cause": self.cause_a.pk,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("selected_cause", resp.data)

    def test_store_one_cause_auto_assigns(self):
        """SC3: Store with 1 cause → auto-assigned even if not sent."""
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_a)
        client = self._client_for(self.consumer)
        resp = client.post("/api/cashback/purchases/", {
            "store": self.store.pk,
            "amount": "100.00",
            "source": "QR",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["selected_cause"], self.cause_a.pk)

    def test_store_one_cause_explicit_valid(self):
        """SC4: Store with 1 cause → explicitly sending it is OK."""
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_a)
        client = self._client_for(self.consumer)
        resp = client.post("/api/cashback/purchases/", {
            "store": self.store.pk,
            "amount": "100.00",
            "source": "QR",
            "selected_cause": self.cause_a.pk,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["selected_cause"], self.cause_a.pk)

    def test_store_one_cause_rejects_wrong_cause(self):
        """SC5: Store with 1 cause → sending a different cause is rejected."""
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_a)
        client = self._client_for(self.consumer)
        resp = client.post("/api/cashback/purchases/", {
            "store": self.store.pk,
            "amount": "100.00",
            "source": "QR",
            "selected_cause": self.cause_b.pk,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("selected_cause", resp.data)

    def test_store_multi_causes_accepts_valid(self):
        """SC6: Store with 2+ causes → sending a valid one is OK."""
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_a)
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_b)
        client = self._client_for(self.consumer)
        resp = client.post("/api/cashback/purchases/", {
            "store": self.store.pk,
            "amount": "100.00",
            "source": "QR",
            "selected_cause": self.cause_b.pk,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["selected_cause"], self.cause_b.pk)

    def test_store_multi_causes_rejects_unsupported(self):
        """SC7: Store with 2+ causes → sending unsupported cause is rejected."""
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_a)
        cause_c = Cause.objects.create(title="CauseC", category="Deporte", is_active=True)
        client = self._client_for(self.consumer)
        resp = client.post("/api/cashback/purchases/", {
            "store": self.store.pk,
            "amount": "100.00",
            "source": "QR",
            "selected_cause": cause_c.pk,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("selected_cause", resp.data)

    def test_store_multi_causes_allows_null_transitional(self):
        """SC8: TRANSITIONAL — Store with 2+ causes → null is allowed temporarily."""
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_a)
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_b)
        client = self._client_for(self.consumer)
        resp = client.post("/api/cashback/purchases/", {
            "store": self.store.pk,
            "amount": "100.00",
            "source": "QR",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(resp.data["selected_cause"])


# ═══════════════════════════════════════════════════════════════════════════
# SC-A. Approve + selected_cause end-to-end
# ═══════════════════════════════════════════════════════════════════════════
class TestApproveWithSelectedCause(BaseTestCase):

    def test_approve_cause_persists_to_transaction(self):
        """SC-A1: cashback cause comes from campaign, not purchase.selected_cause."""
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_a)
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_b)

        # Consumer creates purchase choosing cause_b
        client_c = self._client_for(self.consumer)
        resp = client_c.post("/api/cashback/purchases/", {
            "store": self.store.pk,
            "amount": "200.00",
            "source": "QR",
            "selected_cause": self.cause_b.pk,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        purchase_id = resp.data["id"]

        # Merchant approves — cause comes from campaign (cause_a), not purchase
        client_m = self._client_for(self.merchant_user)
        resp = client_m.post(f"/api/cashback/purchases/{purchase_id}/approve/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["cause"], "CauseA")
        self.assertEqual(resp.data["transactions_count"], 1)

        tx = CashbackTransaction.objects.get(purchase_id=purchase_id)
        self.assertEqual(tx.cause, self.cause_a)
        self.assertEqual(tx.campaign, self.campaign)
        self.assertEqual(tx.amount, Decimal("20.00"))  # 10% of 200

    def test_approve_auto_assigned_single_cause(self):
        """SC-A2: auto-assigned cause also flows through to transaction."""
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_a)

        client_c = self._client_for(self.consumer)
        resp = client_c.post("/api/cashback/purchases/", {
            "store": self.store.pk,
            "amount": "300.00",
            "source": "LINK",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["selected_cause"], self.cause_a.pk)
        purchase_id = resp.data["id"]

        client_m = self._client_for(self.merchant_user)
        resp = client_m.post(f"/api/cashback/purchases/{purchase_id}/approve/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        tx = CashbackTransaction.objects.get(purchase_id=purchase_id)
        self.assertEqual(tx.cause, self.cause_a)
        self.assertEqual(tx.amount, Decimal("30.00"))

    def test_approve_null_cause_uses_campaign_cause(self):
        """SC-A3: even with null selected_cause, cashback uses campaign's cause."""
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_a)
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_b)

        client_c = self._client_for(self.consumer)
        resp = client_c.post("/api/cashback/purchases/", {
            "store": self.store.pk,
            "amount": "400.00",
            "source": "QR",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(resp.data["selected_cause"])
        purchase_id = resp.data["id"]

        client_m = self._client_for(self.merchant_user)
        resp = client_m.post(f"/api/cashback/purchases/{purchase_id}/approve/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["cause"], "CauseA")

        tx = CashbackTransaction.objects.get(purchase_id=purchase_id)
        self.assertEqual(tx.cause, self.cause_a)
        self.assertEqual(tx.amount, Decimal("40.00"))


# ═══════════════════════════════════════════════════════════════════════════
# H. Hardening: overlap, dates, percentage, campaign update
# ═══════════════════════════════════════════════════════════════════════════
class TestCampaignOverlapValidation(BaseTestCase):
    """Overlap detection for active campaigns on the same store."""

    def test_overlap_same_store_rejected(self):
        """Creating a campaign on the same store with overlapping dates → 400."""
        client = self._client_for(self.admin)
        now = timezone.now()
        resp = client.post("/api/cashback/campaigns/", {
            "name": "Overlap Campaign",
            "cause": self.cause_b.pk,
            "store_ids": [self.store.pk],
            "percentage": "5.00",
            "starts_at": (now - timedelta(days=1)).isoformat(),
            "ends_at": (now + timedelta(days=10)).isoformat(),
            "active": True,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("store_ids", resp.data)

    def test_overlap_different_store_allowed(self):
        """Creating on a different store with same dates → 201."""
        client = self._client_for(self.admin)
        now = timezone.now()
        resp = client.post("/api/cashback/campaigns/", {
            "name": "Other Store Campaign",
            "cause": self.cause_b.pk,
            "store_ids": [self.store2.pk],
            "percentage": "5.00",
            "starts_at": (now - timedelta(days=1)).isoformat(),
            "ends_at": (now + timedelta(days=10)).isoformat(),
            "active": True,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_overlap_non_overlapping_dates_allowed(self):
        """Same store but future non-overlapping dates → 201."""
        client = self._client_for(self.admin)
        now = timezone.now()
        resp = client.post("/api/cashback/campaigns/", {
            "name": "Future Campaign",
            "cause": self.cause_a.pk,
            "store_ids": [self.store.pk],
            "percentage": "7.00",
            "starts_at": (now + timedelta(days=31)).isoformat(),
            "ends_at": (now + timedelta(days=60)).isoformat(),
            "active": True,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_overlap_inactive_campaign_allowed(self):
        """Inactive campaign does not trigger overlap check → 201."""
        client = self._client_for(self.admin)
        now = timezone.now()
        resp = client.post("/api/cashback/campaigns/", {
            "name": "Inactive Overlap",
            "cause": self.cause_b.pk,
            "store_ids": [self.store.pk],
            "percentage": "3.00",
            "starts_at": (now - timedelta(days=1)).isoformat(),
            "ends_at": (now + timedelta(days=10)).isoformat(),
            "active": False,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_update_self_no_false_overlap(self):
        """Updating a campaign should not flag itself as overlap."""
        client = self._client_for(self.admin)
        resp = client.patch(f"/api/cashback/campaigns/{self.campaign.pk}/", {
            "name": "Renamed Campaign",
            "store_ids": [self.store.pk],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["name"], "Renamed Campaign")


class TestCampaignDateValidation(BaseTestCase):
    """starts_at must be before ends_at."""

    def test_ends_before_starts_rejected(self):
        client = self._client_for(self.admin)
        now = timezone.now()
        resp = client.post("/api/cashback/campaigns/", {
            "name": "Bad Dates",
            "cause": self.cause_a.pk,
            "store_ids": [self.store2.pk],
            "percentage": "5.00",
            "starts_at": (now + timedelta(days=10)).isoformat(),
            "ends_at": (now + timedelta(days=5)).isoformat(),
            "active": True,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ends_at", resp.data)

    def test_same_start_end_rejected(self):
        client = self._client_for(self.admin)
        ts = timezone.now().isoformat()
        resp = client.post("/api/cashback/campaigns/", {
            "name": "Same Dates",
            "cause": self.cause_a.pk,
            "store_ids": [self.store2.pk],
            "percentage": "5.00",
            "starts_at": ts,
            "ends_at": ts,
            "active": True,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ends_at", resp.data)


class TestCampaignPercentageValidation(BaseTestCase):
    """Percentage must be between 0 and 100."""

    def test_negative_percentage_rejected(self):
        client = self._client_for(self.admin)
        now = timezone.now()
        resp = client.post("/api/cashback/campaigns/", {
            "name": "Neg Pct",
            "cause": self.cause_a.pk,
            "store_ids": [self.store2.pk],
            "percentage": "-1.00",
            "starts_at": (now + timedelta(days=40)).isoformat(),
            "ends_at": (now + timedelta(days=50)).isoformat(),
            "active": True,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_over_100_percentage_rejected(self):
        client = self._client_for(self.admin)
        now = timezone.now()
        resp = client.post("/api/cashback/campaigns/", {
            "name": "High Pct",
            "cause": self.cause_a.pk,
            "store_ids": [self.store2.pk],
            "percentage": "101.00",
            "starts_at": (now + timedelta(days=40)).isoformat(),
            "ends_at": (now + timedelta(days=50)).isoformat(),
            "active": True,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_boundary_0_accepted(self):
        client = self._client_for(self.admin)
        now = timezone.now()
        resp = client.post("/api/cashback/campaigns/", {
            "name": "Zero Pct",
            "cause": self.cause_a.pk,
            "store_ids": [self.store2.pk],
            "percentage": "0.00",
            "starts_at": (now + timedelta(days=40)).isoformat(),
            "ends_at": (now + timedelta(days=50)).isoformat(),
            "active": True,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_boundary_100_accepted(self):
        client = self._client_for(self.admin)
        now = timezone.now()
        resp = client.post("/api/cashback/campaigns/", {
            "name": "Max Pct",
            "cause": self.cause_a.pk,
            "store_ids": [self.store2.pk],
            "percentage": "100.00",
            "starts_at": (now + timedelta(days=51)).isoformat(),
            "ends_at": (now + timedelta(days=60)).isoformat(),
            "active": True,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


class TestCampaignUpdate(BaseTestCase):
    """Campaign update (PATCH) with store_ids replacement."""

    def test_update_stores(self):
        """Admin can replace stores on an existing campaign."""
        client = self._client_for(self.admin)
        resp = client.patch(f"/api/cashback/campaigns/{self.campaign.pk}/", {
            "store_ids": [self.store2.pk],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        store_ids = [cs["store"] for cs in resp.data["campaign_stores"]]
        self.assertEqual(store_ids, [self.store2.pk])

    def test_update_name_only(self):
        """Partial update without store_ids keeps existing stores."""
        client = self._client_for(self.admin)
        resp = client.patch(f"/api/cashback/campaigns/{self.campaign.pk}/", {
            "name": "Updated Name",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["name"], "Updated Name")
        self.assertEqual(len(resp.data["campaign_stores"]), 1)

    def test_merchant_cannot_update_campaign(self):
        """Merchant cannot update campaigns."""
        client = self._client_for(self.merchant_user)
        resp = client.patch(f"/api/cashback/campaigns/{self.campaign.pk}/", {
            "name": "Hacked Name",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class TestCauseCRUD(BaseTestCase):
    """Cause CRUD operations via API."""

    def test_admin_creates_cause(self):
        client = self._client_for(self.admin)
        resp = client.post("/api/causes/", {
            "title": "New Cause",
            "category": "Deporte",
            "is_active": True,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["title"], "New Cause")
        self.assertTrue(resp.data["slug"])  # auto-generated

    def test_admin_updates_cause(self):
        client = self._client_for(self.admin)
        resp = client.patch(f"/api/causes/{self.cause_a.slug}/", {
            "title": "Updated CauseA",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["title"], "Updated CauseA")

    def test_delete_cause_without_campaigns_ok(self):
        cause = Cause.objects.create(title="Temp", category="Deporte", is_active=True)
        client = self._client_for(self.admin)
        resp = client.delete(f"/api/causes/{cause.slug}/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Cause.objects.filter(pk=cause.pk).exists())

    def test_delete_cause_with_campaign_blocked(self):
        """Cannot delete a cause that has campaigns (PROTECT)."""
        client = self._client_for(self.admin)
        resp = client.delete(f"/api/causes/{self.cause_a.slug}/")
        # cause_a is linked to self.campaign → PROTECT handled as 400
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_consumer_cannot_create_cause(self):
        client = self._client_for(self.consumer)
        resp = client.post("/api/causes/", {
            "title": "Consumer Cause",
            "category": "Salud",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
