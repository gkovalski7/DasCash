from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from apps.commerce.models import Store


class Campaign(models.Model):
    name = models.CharField(max_length=255)
    cause = models.ForeignKey("causes.Cause", on_delete=models.PROTECT, related_name="campaigns")
    stores = models.ManyToManyField(Store, through="CampaignStore", related_name="campaigns_m2m")
    percentage = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.name


class CampaignStore(models.Model):
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name="campaign_stores")
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="campaign_stores")
    cashback_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Override del porcentaje global de la campaña para esta tienda. Null = usar global.",
    )

    class Meta:
        unique_together = ("campaign", "store")

    def __str__(self) -> str:
        return f"{self.campaign.name} → {self.store.display_name}"

    @property
    def effective_percentage(self):
        """Porcentaje efectivo: override si existe, sino el global de la campaña."""
        if self.cashback_percentage is not None:
            return self.cashback_percentage
        return self.campaign.percentage


class Purchase(models.Model):
    class Source(models.TextChoices):
        QR = "QR", "QR"
        LINK = "LINK", "LINK"
        RECEIPT = "RECEIPT", "RECEIPT"

    class Status(models.TextChoices):
        PENDING = "PENDING", "PENDING"
        APPROVED = "APPROVED", "APPROVED"
        REJECTED = "REJECTED", "REJECTED"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    store = models.ForeignKey(Store, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    source = models.CharField(max_length=10, choices=Source.choices)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    selected_cause = models.ForeignKey(
        "causes.Cause", on_delete=models.SET_NULL, null=True, blank=True, related_name="purchases"
    )
    created_at = models.DateTimeField(auto_now_add=True)


class CashbackTransaction(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "PENDING"
        SETTLED = "SETTLED", "SETTLED"
        PAID = "PAID", "PAID"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE)
    campaign = models.ForeignKey(Campaign, on_delete=models.SET_NULL, null=True, blank=True, related_name="transactions")
    cause = models.ForeignKey("causes.Cause", on_delete=models.SET_NULL, null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)


class ReceiptUpload(models.Model):
    class OcrStatus(models.TextChoices):
        PENDING = "PENDING", "PENDING"
        OK = "OK", "OK"
        FAILED = "FAILED", "FAILED"

    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE)
    image_path = models.CharField(max_length=255)
    ocr_status = models.CharField(max_length=10, choices=OcrStatus.choices, default=OcrStatus.PENDING)


class MPPaymentData(models.Model):
    class MPStatus(models.TextChoices):
        INITIATED = "INITIATED", "Iniciado"
        APPROVED = "APPROVED", "Aprobado"
        REJECTED = "REJECTED", "Rechazado"
        PENDING = "PENDING", "Pendiente"
        CANCELLED = "CANCELLED", "Cancelado"

    purchase = models.OneToOneField(
        "Purchase",
        on_delete=models.CASCADE,
        related_name="mp_payment",
        verbose_name="Compra",
    )
    preference_id = models.CharField(max_length=200, blank=True, verbose_name="MP Preference ID")
    checkout_url = models.URLField(max_length=500, blank=True, verbose_name="URL de checkout MP")
    mp_payment_id = models.CharField(max_length=100, blank=True, verbose_name="MP Payment ID")
    mp_status = models.CharField(
        max_length=20,
        choices=MPStatus.choices,
        default=MPStatus.INITIATED,
        verbose_name="Estado MP",
    )
    mp_status_detail = models.CharField(max_length=200, blank=True, verbose_name="Detalle de estado MP")
    amount_paid = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Monto pagado en MP"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pago Mercado Pago"
        verbose_name_plural = "Pagos Mercado Pago"

    def __str__(self):
        return f"MPPayment #{self.id} — Purchase {self.purchase_id} — {self.mp_status}"
