import logging
from django.db import transaction as db_transaction
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from apps.commerce.models import Store
from apps.causes.models import Cause
from .models import Purchase, CashbackTransaction, MPPaymentData
from .mp_service import MercadoPagoService
from .qr_service import generate_store_qr_base64, get_store_payment_url

logger = logging.getLogger(__name__)


class StoreQRView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, store_id):
        try:
            store = Store.objects.select_related("merchant").get(
                id=store_id, active=True
            )
        except Store.DoesNotExist:
            return Response(
                {"detail": "Tienda no encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = request.user
        is_admin = user.role == "ADMIN" or user.is_staff
        is_owner = (
            user.role == "MERCHANT" and store.merchant.owner_id == user.id
        )
        if not is_admin and not is_owner:
            return Response(
                {"detail": "No tenés permiso para ver este QR."},
                status=status.HTTP_403_FORBIDDEN,
            )

        qr_data_url = generate_store_qr_base64(store)
        payment_url = get_store_payment_url(store)

        return Response(
            {
                "store_id": store.id,
                "store_name": store.display_name,
                "qrcode_slug": store.qrcode_slug,
                "qr_image": qr_data_url,
                "payment_url": payment_url,
            }
        )


class StoreBySlugView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        try:
            store = (
                Store.objects.select_related("merchant")
                .prefetch_related(
                    "supported_causes__cause",
                    "campaign_stores__campaign",
                )
                .get(qrcode_slug=slug, active=True)
            )
        except Store.DoesNotExist:
            return Response(
                {"detail": "Comercio no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        cashback_pct = None
        active_campaign_store = (
            store.campaign_stores.filter(
                campaign__active=True,
                campaign__starts_at__lte=timezone.now(),
                campaign__ends_at__gte=timezone.now(),
            )
            .select_related("campaign")
            .first()
        )
        if active_campaign_store:
            cashback_pct = (
                active_campaign_store.cashback_percentage
                or active_campaign_store.campaign.percentage
            )

        supported_causes = [
            {
                "id": sc.cause.id,
                "title": sc.cause.title,
                "slug": sc.cause.slug,
                "image_url": sc.cause.image_url,
                "category": sc.cause.category,
            }
            for sc in store.supported_causes.filter(cause__is_active=True)
        ]

        return Response(
            {
                "id": store.id,
                "name": store.display_name,
                "address": store.address,
                "description": store.description,
                "logo_url": store.logo_url,
                "cashback_percentage": str(cashback_pct) if cashback_pct else None,
                "supported_causes": supported_causes,
            }
        )


class InitiateQRPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        slug = request.data.get("store_slug")
        raw_amount = request.data.get("amount")
        cause_id = request.data.get("selected_cause_id")

        if not slug or raw_amount is None:
            return Response(
                {"detail": "store_slug y amount son requeridos."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            amount = float(raw_amount)
            if amount <= 0:
                raise ValueError("El monto debe ser positivo")
        except (ValueError, TypeError):
            return Response(
                {"detail": "El monto debe ser un número positivo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            store = Store.objects.get(qrcode_slug=slug, active=True)
        except Store.DoesNotExist:
            return Response(
                {"detail": "Comercio no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        cause = None
        if cause_id:
            try:
                cause = Cause.objects.get(id=cause_id, is_active=True)
            except Cause.DoesNotExist:
                return Response(
                    {"detail": "Causa no encontrada."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        purchase = Purchase.objects.create(
            user=request.user,
            store=store,
            amount=amount,
            source="QR",
            status="PENDING",
            selected_cause=cause,
        )

        try:
            mp_service = MercadoPagoService()
            mp_data = mp_service.create_checkout_preference(
                purchase=purchase,
                store=store,
                consumer_email=request.user.email,
            )
        except Exception as exc:
            logger.error(
                "Error MP al crear preference para compra %s: %s", purchase.id, exc
            )
            purchase.delete()
            return Response(
                {"detail": f"Error al conectar con Mercado Pago: {exc}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        MPPaymentData.objects.create(
            purchase=purchase,
            preference_id=mp_data["preference_id"],
            checkout_url=mp_data["checkout_url"],
            mp_status=MPPaymentData.MPStatus.INITIATED,
        )

        cashback_pct = None
        active_cs = (
            store.campaign_stores.filter(
                campaign__active=True,
                campaign__starts_at__lte=timezone.now(),
                campaign__ends_at__gte=timezone.now(),
            )
            .select_related("campaign")
            .first()
        )
        if active_cs:
            cashback_pct = active_cs.cashback_percentage or active_cs.campaign.percentage

        return Response(
            {
                "purchase_id": purchase.id,
                "preference_id": mp_data["preference_id"],
                "checkout_url": mp_data["checkout_url"],
                "cashback_preview": {
                    "store": store.display_name,
                    "cause": cause.title if cause else None,
                    "amount": str(amount),
                    "cashback_percentage": str(cashback_pct) if cashback_pct else None,
                },
            },
            status=status.HTTP_201_CREATED,
        )


@method_decorator(csrf_exempt, name="dispatch")
class MPWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        notification_type = request.data.get("type")

        if notification_type != "payment":
            return Response({"status": "ignored"}, status=status.HTTP_200_OK)

        mp_payment_id = request.data.get("data", {}).get("id")
        if not mp_payment_id:
            logger.warning("Webhook MP recibido sin payment ID")
            return Response(
                {"detail": "Missing payment ID"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            self._process_payment(str(mp_payment_id))
        except Exception as exc:
            logger.error(
                "Error procesando webhook MP payment %s: %s", mp_payment_id, exc
            )
            return Response(
                {"status": "error", "detail": str(exc)},
                status=status.HTTP_200_OK,
            )

        return Response({"status": "ok"}, status=status.HTTP_200_OK)

    def _process_payment(self, mp_payment_id: str):
        mp_service = MercadoPagoService()
        payment_data = mp_service.get_payment_details(mp_payment_id)

        mp_status = payment_data.get("status")
        external_ref = payment_data.get("external_reference")

        logger.info(
            "Webhook MP — payment_id: %s | status: %s | external_ref: %s",
            mp_payment_id,
            mp_status,
            external_ref,
        )

        if not external_ref:
            logger.warning(
                "Pago MP %s sin external_reference. Ignorando.", mp_payment_id
            )
            return

        try:
            purchase = Purchase.objects.select_related(
                "store", "user", "selected_cause"
            ).get(id=external_ref)
        except Purchase.DoesNotExist:
            logger.error(
                "Purchase %s no encontrada para payment MP %s",
                external_ref,
                mp_payment_id,
            )
            return

        mp_obj, _ = MPPaymentData.objects.get_or_create(purchase=purchase)
        mp_obj.mp_payment_id = mp_payment_id
        mp_obj.mp_status_detail = payment_data.get("status_detail", "")

        if mp_status == "approved":
            mp_obj.mp_status = MPPaymentData.MPStatus.APPROVED
            mp_obj.amount_paid = payment_data.get("transaction_amount")
            mp_obj.save()
            if purchase.status == "PENDING":
                self._approve_and_generate_cashback(purchase)
        elif mp_status == "rejected":
            mp_obj.mp_status = MPPaymentData.MPStatus.REJECTED
            mp_obj.save()
            purchase.status = "REJECTED"
            purchase.save(update_fields=["status"])
        elif mp_status in ("pending", "in_process", "authorized"):
            mp_obj.mp_status = MPPaymentData.MPStatus.PENDING
            mp_obj.save()
        else:
            mp_obj.mp_status = MPPaymentData.MPStatus.CANCELLED
            mp_obj.save()

    @db_transaction.atomic
    def _approve_and_generate_cashback(self, purchase):
        purchase.status = "APPROVED"
        purchase.save(update_fields=["status"])

        active_campaign_store = (
            purchase.store.campaign_stores.filter(
                campaign__active=True,
                campaign__starts_at__lte=timezone.now(),
                campaign__ends_at__gte=timezone.now(),
            )
            .select_related("campaign")
            .order_by("-cashback_percentage", "-campaign__percentage")
            .first()
        )

        if not active_campaign_store:
            logger.info(
                "Purchase %s aprobada — sin campaña activa, sin cashback.", purchase.id
            )
            return

        if purchase.cashbacktransaction_set.exists():
            logger.warning(
                "Purchase %s ya tiene cashback — ignorando duplicado.", purchase.id
            )
            return

        effective_pct = (
            active_campaign_store.cashback_percentage
            or active_campaign_store.campaign.percentage
        )
        cashback_amount = purchase.amount * effective_pct / 100

        cause = purchase.selected_cause or active_campaign_store.campaign.cause

        CashbackTransaction.objects.create(
            user=purchase.user,
            purchase=purchase,
            campaign=active_campaign_store.campaign,
            cause=cause,
            percentage=effective_pct,
            amount=cashback_amount,
            status="PENDING",
        )

        logger.info(
            "Cashback generado — purchase: %s | monto: %s | causa: %s",
            purchase.id,
            cashback_amount,
            cause.title,
        )
