"""
Phase 1 tests — StoreSupportedCause model, endpoints, and StoreSerializer enrichment.
Covers:
  S1. Unique constraint on StoreSupportedCause
  S2. GET /api/commerce/stores/{id}/causes/ returns correct causes
  S3. Merchant adds cause to own store → 201
  S4. Merchant cannot add cause to another merchant's store → 403
  S5. Admin adds cause to any store → 201
  S6. Duplicate cause on same store → 409
  S7. Consumer cannot add cause → 403
  S8. StoreSerializer includes supported_causes in response
  S9. DELETE /api/commerce/stores/{id}/causes/{cause_id}/ works
  S10. Merchant cannot delete cause from another merchant's store
  S11. Inactive cause cannot be added
  S12. Purchase.selected_cause accepts null and valid FK
"""

from decimal import Decimal

from django.db import IntegrityError
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.commerce.models import Merchant, Store, StoreSupportedCause
from apps.causes.models import Cause
from apps.cashback.models import Purchase

User = get_user_model()


class StoreCauseBaseTestCase(TestCase):
    """Shared fixture for store-cause tests."""

    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_superuser(
            username="sc_admin", email="sca@t.com", password="Pass1234!", role="ADMIN"
        )
        cls.merchant_user = User.objects.create_user(
            username="sc_merchant", email="scm@t.com", password="Pass1234!", role="MERCHANT"
        )
        cls.merchant_user2 = User.objects.create_user(
            username="sc_merchant2", email="scm2@t.com", password="Pass1234!", role="MERCHANT"
        )
        cls.consumer = User.objects.create_user(
            username="sc_consumer", email="scc@t.com", password="Pass1234!", role="CONSUMER"
        )

        cls.merchant = Merchant.objects.create(owner=cls.merchant_user, name="SCMerch", cuit="20-sc1-1")
        cls.merchant2 = Merchant.objects.create(owner=cls.merchant_user2, name="SCMerch2", cuit="20-sc2-2")

        cls.store = Store.objects.create(
            merchant=cls.merchant, display_name="SCStore", qrcode_slug="sc-1", active=True
        )
        cls.store2 = Store.objects.create(
            merchant=cls.merchant2, display_name="SCStore2", qrcode_slug="sc-2", active=True
        )

        cls.cause_a = Cause.objects.create(title="SC CauseA", category="Educación", is_active=True)
        cls.cause_b = Cause.objects.create(title="SC CauseB", category="Salud", is_active=True)
        cls.cause_c = Cause.objects.create(title="SC CauseC", category="Deporte", is_active=True)
        cls.cause_inactive = Cause.objects.create(title="SC Inactive", category="Ambiente", is_active=False)

    def _client_for(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c


# ═══════════════════════════════════════════════════════════════════════════
# S1. Unique constraint
# ═══════════════════════════════════════════════════════════════════════════
class TestStoreSupportedCauseModel(StoreCauseBaseTestCase):

    def test_unique_constraint(self):
        """S1: Cannot add the same cause to the same store twice at DB level."""
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_a)
        with self.assertRaises(IntegrityError):
            StoreSupportedCause.objects.create(store=self.store, cause=self.cause_a)

    def test_str_representation(self):
        obj = StoreSupportedCause.objects.create(store=self.store, cause=self.cause_b)
        self.assertIn("SCStore", str(obj))
        self.assertIn("SC CauseB", str(obj))


# ═══════════════════════════════════════════════════════════════════════════
# S2. GET /api/commerce/stores/{id}/causes/
# ═══════════════════════════════════════════════════════════════════════════
class TestListStoreCauses(StoreCauseBaseTestCase):

    def test_list_causes_empty(self):
        """S2a: Store with no causes returns empty list."""
        client = self._client_for(self.consumer)
        resp = client.get(f"/api/commerce/stores/{self.store.pk}/causes/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data, [])

    def test_list_causes_populated(self):
        """S2b: Store with causes returns them."""
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_a)
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_b)

        client = self._client_for(self.consumer)
        resp = client.get(f"/api/commerce/stores/{self.store.pk}/causes/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)
        titles = {c["title"] for c in resp.data}
        self.assertEqual(titles, {"SC CauseA", "SC CauseB"})

    def test_list_causes_has_correct_fields(self):
        """S2c: Response includes expected fields."""
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_a)
        client = self._client_for(self.consumer)
        resp = client.get(f"/api/commerce/stores/{self.store.pk}/causes/")
        item = resp.data[0]
        self.assertIn("id", item)
        self.assertIn("cause_id", item)
        self.assertIn("title", item)
        self.assertIn("slug", item)
        self.assertIn("category", item)
        self.assertIn("added_at", item)

    def test_list_causes_unauthenticated(self):
        """S2d: Unauthenticated request is rejected."""
        resp = APIClient().get(f"/api/commerce/stores/{self.store.pk}/causes/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_causes_nonexistent_store(self):
        """S2e: 404 for nonexistent store."""
        client = self._client_for(self.consumer)
        resp = client.get("/api/commerce/stores/99999/causes/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


# ═══════════════════════════════════════════════════════════════════════════
# S3-S7. POST /api/commerce/stores/{id}/causes/
# ═══════════════════════════════════════════════════════════════════════════
class TestAddStoreCause(StoreCauseBaseTestCase):

    def test_merchant_adds_cause_own_store(self):
        """S3: Merchant adds a cause to their own store → 201."""
        client = self._client_for(self.merchant_user)
        resp = client.post(
            f"/api/commerce/stores/{self.store.pk}/causes/",
            {"cause": self.cause_a.pk},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["title"], "SC CauseA")
        self.assertTrue(StoreSupportedCause.objects.filter(store=self.store, cause=self.cause_a).exists())

    def test_merchant_cannot_add_cause_other_store(self):
        """S4: Merchant cannot add cause to another merchant's store → 403."""
        client = self._client_for(self.merchant_user)
        resp = client.post(
            f"/api/commerce/stores/{self.store2.pk}/causes/",
            {"cause": self.cause_a.pk},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_adds_cause_any_store(self):
        """S5: Admin can add cause to any store → 201."""
        client = self._client_for(self.admin)
        resp = client.post(
            f"/api/commerce/stores/{self.store2.pk}/causes/",
            {"cause": self.cause_b.pk},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_duplicate_cause_rejected(self):
        """S6: Adding the same cause twice → 409."""
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_a)
        client = self._client_for(self.merchant_user)
        resp = client.post(
            f"/api/commerce/stores/{self.store.pk}/causes/",
            {"cause": self.cause_a.pk},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_409_CONFLICT)

    def test_consumer_cannot_add_cause(self):
        """S7: Consumer cannot add causes → 403."""
        client = self._client_for(self.consumer)
        resp = client.post(
            f"/api/commerce/stores/{self.store.pk}/causes/",
            {"cause": self.cause_a.pk},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_inactive_cause_rejected(self):
        """S11: Cannot add an inactive cause → 404."""
        client = self._client_for(self.merchant_user)
        resp = client.post(
            f"/api/commerce/stores/{self.store.pk}/causes/",
            {"cause": self.cause_inactive.pk},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_nonexistent_cause_rejected(self):
        """Adding a cause that doesn't exist → 404."""
        client = self._client_for(self.merchant_user)
        resp = client.post(
            f"/api/commerce/stores/{self.store.pk}/causes/",
            {"cause": 99999},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


# ═══════════════════════════════════════════════════════════════════════════
# S8. StoreSerializer includes supported_causes
# ═══════════════════════════════════════════════════════════════════════════
class TestStoreSerializerEnrichment(StoreCauseBaseTestCase):

    def test_store_list_includes_supported_causes(self):
        """S8: GET /api/commerce/stores/ includes supported_causes field."""
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_a)
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_b)

        client = self._client_for(self.consumer)
        resp = client.get("/api/commerce/stores/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        store_data = next(s for s in resp.data if s["id"] == self.store.pk)
        self.assertIn("supported_causes", store_data)
        self.assertEqual(len(store_data["supported_causes"]), 2)

    def test_store_detail_includes_supported_causes(self):
        """S8b: GET /api/commerce/stores/{id}/ includes supported_causes."""
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_c)

        client = self._client_for(self.consumer)
        resp = client.get(f"/api/commerce/stores/{self.store.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("supported_causes", resp.data)
        self.assertEqual(len(resp.data["supported_causes"]), 1)
        self.assertEqual(resp.data["supported_causes"][0]["title"], "SC CauseC")

    def test_store_without_causes_has_empty_list(self):
        """S8c: Store with no causes returns empty supported_causes."""
        client = self._client_for(self.consumer)
        resp = client.get(f"/api/commerce/stores/{self.store2.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["supported_causes"], [])


# ═══════════════════════════════════════════════════════════════════════════
# S9-S10. DELETE /api/commerce/stores/{id}/causes/{cause_id}/
# ═══════════════════════════════════════════════════════════════════════════
class TestDeleteStoreCause(StoreCauseBaseTestCase):

    def test_merchant_deletes_cause_own_store(self):
        """S9: Merchant can remove a cause from their own store → 204."""
        StoreSupportedCause.objects.create(store=self.store, cause=self.cause_a)
        client = self._client_for(self.merchant_user)
        resp = client.delete(f"/api/commerce/stores/{self.store.pk}/causes/{self.cause_a.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(StoreSupportedCause.objects.filter(store=self.store, cause=self.cause_a).exists())

    def test_merchant_cannot_delete_cause_other_store(self):
        """S10: Merchant cannot remove cause from another merchant's store → 403."""
        StoreSupportedCause.objects.create(store=self.store2, cause=self.cause_a)
        client = self._client_for(self.merchant_user)
        resp = client.delete(f"/api/commerce/stores/{self.store2.pk}/causes/{self.cause_a.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_deletes_cause_any_store(self):
        """Admin can remove cause from any store → 204."""
        StoreSupportedCause.objects.create(store=self.store2, cause=self.cause_b)
        client = self._client_for(self.admin)
        resp = client.delete(f"/api/commerce/stores/{self.store2.pk}/causes/{self.cause_b.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_nonexistent_returns_404(self):
        """Deleting a cause not associated returns 404."""
        client = self._client_for(self.merchant_user)
        resp = client.delete(f"/api/commerce/stores/{self.store.pk}/causes/{self.cause_a.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


# ═══════════════════════════════════════════════════════════════════════════
# S12. Purchase.selected_cause field
# ═══════════════════════════════════════════════════════════════════════════
class TestPurchaseSelectedCauseField(StoreCauseBaseTestCase):

    def test_purchase_with_null_selected_cause(self):
        """S12a: Purchase can be created with selected_cause=None."""
        p = Purchase.objects.create(
            user=self.consumer, store=self.store,
            amount=Decimal("100"), source="QR",
        )
        self.assertIsNone(p.selected_cause)

    def test_purchase_with_valid_selected_cause(self):
        """S12b: Purchase can be created with a valid cause FK."""
        p = Purchase.objects.create(
            user=self.consumer, store=self.store,
            amount=Decimal("200"), source="QR",
            selected_cause=self.cause_a,
        )
        p.refresh_from_db()
        self.assertEqual(p.selected_cause, self.cause_a)

    def test_existing_purchases_unaffected(self):
        """S12c: Existing purchases without selected_cause still work via API."""
        Purchase.objects.create(
            user=self.consumer, store=self.store,
            amount=Decimal("300"), source="LINK",
        )
        client = self._client_for(self.consumer)
        resp = client.get("/api/cashback/purchases/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
