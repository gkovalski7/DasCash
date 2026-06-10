from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    class Roles(models.TextChoices):
        CONSUMER = "CONSUMER", "Consumer"
        MERCHANT = "MERCHANT", "Merchant"
        ADMIN = "ADMIN", "Admin"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.CONSUMER)

    def __str__(self) -> str:
        return f"{self.username} ({self.role})"
