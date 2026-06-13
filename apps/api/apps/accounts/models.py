from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    class Roles(models.TextChoices):
        CONSUMER = "CONSUMER", "Consumer"
        MERCHANT = "MERCHANT", "Merchant"
        ADMIN = "ADMIN", "Admin"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.CONSUMER)
    preferred_cause = models.ForeignKey(
        "causes.Cause",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="preferred_by",
        help_text="Causa que el usuario apoya por defecto; se preselecciona al pagar.",
    )

    def __str__(self) -> str:
        return f"{self.username} ({self.role})"
