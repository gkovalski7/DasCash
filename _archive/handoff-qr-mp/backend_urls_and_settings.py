"""
INSTRUCCIONES DE MODIFICACIÓN DE URLs

=======================================================================
ARCHIVO 1: apps/api/cashback/urls.py
ACCIÓN: MODIFICAR — Agregar los nuevos endpoints de pago

Buscá el bloque de urlpatterns existente y agregá estas líneas:
=======================================================================

from .payment_views import (
    InitiateQRPaymentView,
    MPWebhookView,
)

# Dentro de urlpatterns, agregar:
    path("payments/initiate/", InitiateQRPaymentView.as_view(), name="payment-initiate"),
    path("webhooks/mercadopago/", MPWebhookView.as_view(), name="webhook-mp"),


=======================================================================
ARCHIVO 2: apps/api/commerce/urls.py
ACCIÓN: MODIFICAR — Agregar los endpoints de QR y slug

from cashback.payment_views import (
    StoreQRView,
    StoreBySlugView,
)

# Dentro de urlpatterns, agregar:
    path("stores/<int:store_id>/qr/", StoreQRView.as_view(), name="store-qr"),
    path("stores/by-slug/<str:slug>/", StoreBySlugView.as_view(), name="store-by-slug"),

IMPORTANTE: la ruta 'by-slug/' debe ir ANTES de cualquier ruta con <int:pk>
para evitar conflictos de matching.


=======================================================================
ARCHIVO 3: apps/api/config/settings.py (o donde estén las settings del proyecto)
ACCIÓN: MODIFICAR — Agregar las variables de MP al final del archivo
=======================================================================

# Mercado Pago
import os

MP_ACCESS_TOKEN = os.environ.get("MP_ACCESS_TOKEN", "")
MP_SANDBOX = os.environ.get("MP_SANDBOX", "true").lower() == "true"
BACKEND_BASE_URL = os.environ.get("BACKEND_BASE_URL", "http://localhost:8000")
FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "http://localhost:5173")


=======================================================================
ARCHIVO 4: apps/api/.env  (o el .env que usa el proyecto)
ACCIÓN: MODIFICAR — Agregar variables al final
=======================================================================

# Mercado Pago — Fase 1 (Checkout Pro, sin Marketplace split)
# Obtener en: https://www.mercadopago.com.ar/developers/panel/app
MP_ACCESS_TOKEN=TEST-0000000000000000-000000-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-000000000
MP_SANDBOX=true
BACKEND_BASE_URL=http://localhost:8000
FRONTEND_BASE_URL=http://localhost:5173


=======================================================================
ARCHIVO 5: apps/api/requirements.txt
ACCIÓN: MODIFICAR — Agregar estas dos líneas
=======================================================================

mercadopago>=2.2.5
qrcode[pil]>=7.4.2


=======================================================================
MIGRACIÓN
ACCIÓN: Después de modificar models.py, ejecutar dentro del container:
=======================================================================

docker compose -f infra/docker-compose.yml exec api python manage.py makemigrations cashback
docker compose -f infra/docker-compose.yml exec api python manage.py migrate

O si trabajás fuera de Docker:
    cd apps/api
    python manage.py makemigrations cashback
    python manage.py migrate
"""

URLPATTERNS_CASHBACK = """
# ============================================================
# CONTENIDO COMPLETO SUGERIDO para apps/api/cashback/urls.py
# (reemplazá el archivo entero si es más fácil que editar)
# ============================================================

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CampaignViewSet,
    PurchaseViewSet,
    CashbackTransactionViewSet,
)
from .payment_views import (
    InitiateQRPaymentView,
    MPWebhookView,
)

router = DefaultRouter()
router.register(r"campaigns", CampaignViewSet, basename="campaign")
router.register(r"purchases", PurchaseViewSet, basename="purchase")
router.register(r"transactions", CashbackTransactionViewSet, basename="cashbacktransaction")

urlpatterns = [
    path("", include(router.urls)),
    # Flujo de pago QR
    path("payments/initiate/", InitiateQRPaymentView.as_view(), name="payment-initiate"),
    path("webhooks/mercadopago/", MPWebhookView.as_view(), name="webhook-mp"),
]
"""

URLPATTERNS_COMMERCE = """
# ============================================================
# AGREGADO en apps/api/commerce/urls.py
# (solo agregar estas líneas al urlpatterns existente)
# ============================================================

from cashback.payment_views import StoreQRView, StoreBySlugView

# Agregar dentro de urlpatterns:
path("stores/<int:store_id>/qr/",       StoreQRView.as_view(),     name="store-qr"),
path("stores/by-slug/<str:slug>/",      StoreBySlugView.as_view(), name="store-by-slug"),

# IMPORTANTE: estas rutas deben ir ANTES del router.urls o de cualquier
# path("stores/<int:pk>/", ...) para evitar que 'by-slug' sea interpretado
# como un pk entero.
"""
