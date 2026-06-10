import io
import base64
import qrcode
import qrcode.constants
from django.conf import settings


def generate_store_qr_base64(store) -> str:
    frontend_url = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:5173")
    payment_url = f"{frontend_url}/app/pagar/{store.qrcode_slug}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(payment_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#0A2236", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    img_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_b64}"


def get_store_payment_url(store) -> str:
    frontend_url = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:5173")
    return f"{frontend_url}/app/pagar/{store.qrcode_slug}"
