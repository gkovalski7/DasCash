from decimal import Decimal
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.causes.models import Cause
from apps.cashback.models import Goal


class CauseActiveGoalTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cause = Cause.objects.create(title="Club X", category="Deporte", is_active=True)

    def test_detalle_de_causa_sin_meta_devuelve_active_goal_null(self):
        res = self.client.get(f"/api/causes/{self.cause.slug}/")
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.data["active_goal"])

    def test_detalle_de_causa_con_meta_devuelve_shape(self):
        Goal.objects.create(
            cause=self.cause, title="Camisetas", target_amount=Decimal("1000"),
            active=True, starts_at=timezone.now() - timedelta(days=1),
        )
        res = self.client.get(f"/api/causes/{self.cause.slug}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["active_goal"]["title"], "Camisetas")
        self.assertIn("percent", res.data["active_goal"])
        self.assertIn("current_amount", res.data["active_goal"])

    def test_list_no_computa_active_goal(self):
        from apps.cashback.models import Goal
        c2 = Cause.objects.create(title="Club Y", category="Deporte", is_active=True)
        for c in (self.cause, c2):
            Goal.objects.create(
                cause=c, title="Meta", target_amount=Decimal("1000"),
                active=True, starts_at=timezone.now() - timedelta(days=1),
            )
        res = self.client.get("/api/causes/")
        self.assertEqual(res.status_code, 200)
        # la lista no expone la meta (se computa solo en el detalle)
        items = res.data["results"] if isinstance(res.data, dict) and "results" in res.data else res.data
        for item in items:
            self.assertIsNone(item["active_goal"])
