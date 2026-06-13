from decimal import Decimal

from django.utils import timezone
from rest_framework import status as http_status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Campaign, CampaignStore, Purchase, CashbackTransaction, Goal, active_goal_for
from .serializers import (
    CampaignSerializer,
    PurchaseSerializer,
    CashbackTransactionSerializer,
    GoalSerializer,
)
from apps.accounts.permissions import IsAdmin, IsMerchant, IsConsumer
from core.pagination import StandardPagination


class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.select_related("cause").prefetch_related("campaign_stores__store").all()
    serializer_class = CampaignSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == "ADMIN" or user.is_staff:
            return qs
        if user.role == "MERCHANT":
            return qs.filter(campaign_stores__store__merchant__owner=user).distinct()
        return qs.none()


class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = (
        Purchase.objects.select_related("store", "selected_cause")
        .all()
        .order_by("-created_at", "-id")
    )
    serializer_class = PurchaseSerializer
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action == "create":
            return [IsConsumer()]
        if self.action == "approve":
            return [(IsMerchant | IsAdmin)()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == "ADMIN" or user.is_staff:
            return qs
        if user.role == "MERCHANT":
            return qs.filter(store__merchant__owner=user)
        return qs.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsMerchant | IsAdmin])
    def approve(self, request, pk=None):
        purchase = self.get_object()

        if purchase.status != Purchase.Status.PENDING:
            return Response(
                {"detail": f"La compra ya está en estado {purchase.status}."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        # Deduplication: never generate cashback twice
        if purchase.cashbacktransaction_set.exists():
            return Response(
                {"detail": "Ya se generó cashback para esta compra."},
                status=http_status.HTTP_409_CONFLICT,
            )

        purchase.status = Purchase.Status.APPROVED
        purchase.save(update_fields=["status"])

        # Find active campaign for the store via CampaignStore
        now = timezone.now()
        campaign_store = CampaignStore.objects.filter(
            store=purchase.store,
            campaign__active=True,
            campaign__starts_at__lte=now,
            campaign__ends_at__gte=now,
        ).select_related("campaign", "campaign__cause").order_by("-campaign__percentage").first()

        if not campaign_store:
            return Response({
                "detail": "Compra aprobada. No hay campaña activa; no se generó cashback.",
                "cashback_generated": False,
            })

        effective_pct = campaign_store.effective_percentage
        cashback_total = (purchase.amount * effective_pct / Decimal("100")).quantize(Decimal("0.01"))

        # Use campaign's cause for the cashback transaction
        cause = campaign_store.campaign.cause

        CashbackTransaction.objects.create(
            user=purchase.user,
            purchase=purchase,
            campaign=campaign_store.campaign,
            cause=cause,
            percentage=effective_pct,
            amount=cashback_total,
        )

        return Response({
            "detail": "Compra aprobada. Cashback generado.",
            "cashback_generated": True,
            "cashback_total": str(cashback_total),
            "transactions_count": 1,
            "cause": cause.title if cause else None,
            "campaign": campaign_store.campaign.name,
        })

    @action(detail=True, methods=["get"])
    def impact(self, request, pk=None):
        purchase = self.get_object()
        txn = purchase.cashbacktransaction_set.first()
        cause = txn.cause if txn else purchase.selected_cause
        goal = active_goal_for(cause) if cause else None
        return Response({
            "status": purchase.status,
            "contribution": str(txn.amount) if txn else None,
            "cause_title": cause.title if cause else None,
            "goal": GoalSerializer(goal).data if goal else None,
        })


class CashbackTransactionViewSet(viewsets.ModelViewSet):
    queryset = CashbackTransaction.objects.all()
    serializer_class = CashbackTransactionSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.IsAuthenticated()]
        # Fase 1 implementará creación automática desde Purchase aprobado.
        # Hasta entonces, solo ADMIN puede crear/modificar transacciones.
        return [IsAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == "ADMIN" or user.is_staff:
            return qs
        if user.role == "MERCHANT":
            return qs.filter(purchase__store__merchant__owner=user)
        return qs.filter(user=user)



