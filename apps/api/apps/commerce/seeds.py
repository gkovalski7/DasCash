from django.utils.text import slugify
from django.contrib.auth import get_user_model
from .models import Merchant, Store, Category, StoreSupportedCause

User = get_user_model()


def seed():
    merchant_user = User.objects.filter(email="merchant@example.com").first()
    if not merchant_user:
        return
    merchant, _ = Merchant.objects.get_or_create(owner=merchant_user, name="Tienda Demo", cuit="20-12345678-9")

    # Categories
    cat_ropa, _ = Category.objects.get_or_create(name="Ropa", slug="ropa", defaults={"participates_in_cashback": True})
    cat_electro, _ = Category.objects.get_or_create(name="Electrónica", slug="electronica", defaults={"participates_in_cashback": True})
    cat_gift, _ = Category.objects.get_or_create(name="Gift Cards", slug="gift-cards", defaults={"participates_in_cashback": False})
    cat_envios, _ = Category.objects.get_or_create(name="Envíos", slug="envios", defaults={"participates_in_cashback": False})

    # Stores
    s1, _ = Store.objects.get_or_create(
        merchant=merchant,
        display_name="Sucursal Centro",
        defaults={
            "address": "Calle Falsa 123",
            "qrcode_slug": slugify("sucursal-centro"),
            "description": "Moda urbana y accesorios.",
            "logo_url": "https://dummyimage.com/160x160/edf2f7/1f2937&text=Centro",
            "website_url": "https://ejemplo.com",
            "instagram_url": "https://instagram.com/ejemplo",
            "active": True,
        },
    )
    s1.categories.set([cat_ropa, cat_gift])

    s2, _ = Store.objects.get_or_create(
        merchant=merchant,
        display_name="Sucursal Norte",
        defaults={
            "address": "Av. Siempre Viva 742",
            "qrcode_slug": slugify("sucursal-norte"),
            "description": "Tecnología y servicios.",
            "logo_url": "https://dummyimage.com/160x160/e5e7eb/111827&text=Norte",
            "website_url": "https://ejemplo.com/norte",
            "instagram_url": "https://instagram.com/ejemplo",
            "active": True,
        },
    )
    s2.categories.set([cat_electro, cat_envios])

    # Supported causes — link stores to existing causes
    from apps.causes.models import Cause

    causes = list(Cause.objects.filter(is_active=True)[:3])
    if causes:
        # s1 supports first two causes, s2 supports last one
        for cause in causes[:2]:
            StoreSupportedCause.objects.get_or_create(store=s1, cause=cause)
        StoreSupportedCause.objects.get_or_create(store=s2, cause=causes[-1])
