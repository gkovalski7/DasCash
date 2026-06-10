"""
ARCHIVO: apps/api/cashback/models.py
ACCIÓN:  MODIFICAR — Agregar el modelo MPPaymentData al FINAL del archivo

Instrucción para Claude Code:
  Abrí apps/api/cashback/models.py y pegá el bloque de código de abajo
  DESPUÉS de la clase ReceiptUpload (que es la última clase del archivo).
  No modificar nada de lo que ya existe.
"""

# ====================================================================
# PEGAR ESTO AL FINAL DE apps/api/cashback/models.py
# (después de la clase ReceiptUpload)
# ====================================================================

from django.db import models  # ya importado en el archivo original, no duplicar


class MPPaymentData(models.Model):
    """
    Almacena los datos de Mercado Pago asociados a una Purchase.

    Ciclo de vida:
      INITIATED  → El consumer inició el flujo (preference creada en MP)
      APPROVED   → MP confirmó el pago. Purchase auto-aprobada.
      REJECTED   → MP rechazó el pago. Purchase marcada REJECTED.
      PENDING    → Pago en proceso (ej: transferencia bancaria).
      CANCELLED  → Pago cancelado.
    """

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
    preference_id = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="MP Preference ID",
    )
    checkout_url = models.URLField(
        max_length=500,
        blank=True,
        verbose_name="URL de checkout MP",
    )
    mp_payment_id = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="MP Payment ID",
        help_text="Completado cuando el webhook de MP confirma el pago.",
    )
    mp_status = models.CharField(
        max_length=20,
        choices=MPStatus.choices,
        default=MPStatus.INITIATED,
        verbose_name="Estado MP",
    )
    mp_status_detail = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Detalle de estado MP",
        help_text="Campo status_detail de la respuesta de MP (ej: 'accredited').",
    )
    amount_paid = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Monto pagado en MP",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pago Mercado Pago"
        verbose_name_plural = "Pagos Mercado Pago"

    def __str__(self):
        return (
            f"MPPayment #{self.id} — "
            f"Purchase {self.purchase_id} — "
            f"{self.mp_status}"
        )
