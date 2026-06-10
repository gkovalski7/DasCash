import logging
import mercadopago
from django.conf import settings

logger = logging.getLogger(__name__)


class MercadoPagoService:
    def __init__(self):
        access_token = getattr(settings, "MP_ACCESS_TOKEN", None)
        if not access_token:
            raise ValueError("MP_ACCESS_TOKEN no está configurado en settings / .env")
        self.sdk = mercadopago.SDK(access_token)
        self.is_sandbox = getattr(settings, "MP_SANDBOX", True)

    def create_checkout_preference(self, purchase, store, consumer_email: str) -> dict:
        frontend_url = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:5173")
        backend_url = getattr(settings, "BACKEND_BASE_URL", "http://localhost:8000")

        cause_name = (
            purchase.selected_cause.title if purchase.selected_cause else "tu causa"
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
            "payer": {"email": consumer_email},
            "external_reference": str(purchase.id),
            "notification_url": f"{backend_url}/api/cashback/webhooks/mercadopago/",
            "back_urls": {
                "success": f"{frontend_url}/app/pago-exitoso",
                "failure": f"{frontend_url}/app/pago-fallido",
                "pending": f"{frontend_url}/app/pago-pendiente",
            },
            "auto_return": "approved",
            "statement_descriptor": "DASCASH",
            "binary_mode": False,
        }

        result = self.sdk.preference().create(preference_data)

        if result["status"] != 201:
            logger.error(
                "Error creando preference MP para compra %s: %s", purchase.id, result
            )
            raise Exception(
                f"Error MP al crear preference: {result.get('response', {})}"
            )

        preference = result["response"]
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

    def get_payment_details(self, mp_payment_id: str) -> dict:
        result = self.sdk.payment().get(int(mp_payment_id))
        if result["status"] != 200:
            raise Exception(
                f"Pago {mp_payment_id} no encontrado en MP "
                f"(status HTTP {result['status']})"
            )
        return result["response"]

    def is_payment_approved(self, payment_data: dict) -> bool:
        return payment_data.get("status") == "approved"
