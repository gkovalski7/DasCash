"""
ARCHIVO: apps/api/cashback/mp_service.py
ACCIÓN:  CREAR (archivo nuevo)

Servicio de integración con Mercado Pago Checkout Pro.
Fase 1: Checkout Pro estándar (sin split Marketplace).
Fase 2: MP Marketplace con split automático al comercio.

Docs MP: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro
"""

import logging
import mercadopago
from django.conf import settings

logger = logging.getLogger(__name__)


class MercadoPagoService:
    """
    Wraps the Mercado Pago Python SDK.

    En Fase 1 el flujo es:
      1. DasCash crea una 'preference' de pago.
      2. El consumer paga en MP (su billetera habitual).
      3. MP dispara un webhook → nuestro endpoint lo recibe.
      4. Aprobamos automáticamente la Purchase y generamos el cashback.

    En Fase 2 (con aval del municipio + acuerdo con MP):
      - DasCash se convierte en Marketplace.
      - El split 95/5 ocurre automáticamente dentro de MP.
    """

    def __init__(self):
        access_token = getattr(settings, "MP_ACCESS_TOKEN", None)
        if not access_token:
            raise ValueError(
                "MP_ACCESS_TOKEN no está configurado en settings / .env"
            )
        self.sdk = mercadopago.SDK(access_token)
        self.is_sandbox = getattr(settings, "MP_SANDBOX", True)

    # ------------------------------------------------------------------
    # Crear preference de pago
    # ------------------------------------------------------------------

    def create_checkout_preference(
        self, purchase, store, consumer_email: str
    ) -> dict:
        """
        Crea una Checkout Pro Preference para una compra.

        Devuelve:
            {
                "preference_id": "...",
                "checkout_url": "...",   # sandbox o producción según settings
            }
        """
        frontend_url = getattr(
            settings, "FRONTEND_BASE_URL", "http://localhost:5173"
        )
        backend_url = getattr(
            settings, "BACKEND_BASE_URL", "http://localhost:8000"
        )

        cause_name = (
            purchase.selected_cause.title
            if purchase.selected_cause
            else "tu causa"
        )

        preference_data = {
            "items": [
                {
                    "id": str(store.id),
                    "title": f"Compra en {store.display_name}",
                    "description": (
                        f"Comprando en {store.display_name} apoyás a "
                        f"{cause_name} vía DasCash"
                    ),
                    "quantity": 1,
                    "currency_id": "ARS",
                    "unit_price": float(purchase.amount),
                }
            ],
            "payer": {
                "email": consumer_email
            },
            # external_reference nos permite identificar la compra en el webhook
            "external_reference": str(purchase.id),
            # MP llama a este endpoint cuando el pago se confirma
            "notification_url": (
                f"{backend_url}/api/cashback/webhooks/mercadopago/"
            ),
            "back_urls": {
                "success": f"{frontend_url}/app/pago-exitoso",
                "failure": f"{frontend_url}/app/pago-fallido",
                "pending": f"{frontend_url}/app/pago-pendiente",
            },
            # Redirigir automáticamente al usuario luego del pago aprobado
            "auto_return": "approved",
            # Nombre que aparece en el resumen de cuenta del pagador
            "statement_descriptor": "DASCASH",
            # binary_mode=False permite pagos 'en proceso' (transferencias bancarias)
            "binary_mode": False,
        }

        result = self.sdk.preference().create(preference_data)

        if result["status"] != 201:
            logger.error(
                "Error creando preference MP para compra %s: %s",
                purchase.id,
                result,
            )
            raise Exception(
                f"Error MP al crear preference: {result.get('response', {})}"
            )

        preference = result["response"]
        # Sandbox vs producción
        checkout_url = (
            preference["sandbox_init_point"]
            if self.is_sandbox
            else preference["init_point"]
        )

        logger.info(
            "MP preference creada: %s | compra: %s | sandbox: %s",
            preference["id"],
            purchase.id,
            self.is_sandbox,
        )

        return {
            "preference_id": preference["id"],
            "checkout_url": checkout_url,
        }

    # ------------------------------------------------------------------
    # Consultar pago (usado desde el webhook handler)
    # ------------------------------------------------------------------

    def get_payment_details(self, mp_payment_id: str) -> dict:
        """
        Consulta los detalles de un pago en MP por su ID.
        Retorna el dict completo de la respuesta de MP.
        """
        result = self.sdk.payment().get(int(mp_payment_id))
        if result["status"] != 200:
            raise Exception(
                f"Pago {mp_payment_id} no encontrado en MP "
                f"(status HTTP {result['status']})"
            )
        return result["response"]

    def is_payment_approved(self, payment_data: dict) -> bool:
        """True si el pago tiene status 'approved' en MP."""
        return payment_data.get("status") == "approved"
