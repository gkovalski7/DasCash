from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CampaignViewSet, PurchaseViewSet, CashbackTransactionViewSet
from .payment_views import InitiateQRPaymentView, MPWebhookView

router = DefaultRouter()
router.register(r"campaigns", CampaignViewSet)
router.register(r"purchases", PurchaseViewSet)
router.register(r"transactions", CashbackTransactionViewSet)

urlpatterns = [
    path("payments/initiate/", InitiateQRPaymentView.as_view(), name="payment-initiate"),
    path("webhooks/mercadopago/", MPWebhookView.as_view(), name="webhook-mp"),
] + list(router.urls)
