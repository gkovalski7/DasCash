"""
ARCHIVO: apps/api/cashback/qr_service.py
ACCIÓN:  CREAR (archivo nuevo)

Servicio para generar los QR codes de cada comercio.
El QR encode la URL de pago de DasCash para esa tienda.
"""

import io
import base64
import qrcode
import qrcode.constants
from django.conf import settings


def generate_store_qr_base64(store) -> str:
    """
    Genera el QR code PNG de la página de pago de un comercio.

    El QR encode la URL:
        {FRONTEND_BASE_URL}/app/pagar/{store.qrcode_slug}

    Retorna una data URL base64 lista para incrustar en <img src="...">
    o para descargar como PNG.

    El 'qrcode_slug' ya existe en el modelo Store — no necesitamos
    agregar ningún campo nuevo.
    """
    frontend_url = getattr(
        settings, "FRONTEND_BASE_URL", "http://localhost:5173"
    )
    payment_url = f"{frontend_url}/app/pagar/{store.qrcode_slug}"

    qr = qrcode.QRCode(
        version=1,
        # ERROR_CORRECT_H = 30% de corrección. Permite logos superpuestos
        # y lectura aunque el QR esté levemente dañado o sucio.
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(payment_url)
    qr.make(fit=True)

    # Colores alineados con la paleta DasCash (navy-900 = #0A2236)
    img = qr.make_image(fill_color="#0A2236", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    img_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_b64}"


def get_store_payment_url(store) -> str:
    """Devuelve la URL de pago de una tienda (sin generar el QR)."""
    frontend_url = getattr(
        settings, "FRONTEND_BASE_URL", "http://localhost:5173"
    )
    return f"{frontend_url}/app/pagar/{store.qrcode_slug}"
