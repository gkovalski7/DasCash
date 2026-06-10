from django.conf import settings
from django.db import models


class Merchant(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={"role": "MERCHANT"})
    name = models.CharField(max_length=255)
    cuit = models.CharField(max_length=32)
    status = models.CharField(max_length=32, default="ACTIVE")

    def __str__(self) -> str:
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True)
    participates_in_cashback = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Store(models.Model):
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name="stores")
    display_name = models.CharField(max_length=255)
    address = models.CharField(max_length=255, blank=True)
    qrcode_slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    logo_url = models.URLField(blank=True)
    website_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    active = models.BooleanField(default=True)
    categories = models.ManyToManyField(Category, related_name="stores", blank=True)

    def __str__(self) -> str:
        return f"{self.display_name}"


class StoreSupportedCause(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="supported_causes")
    cause = models.ForeignKey("causes.Cause", on_delete=models.CASCADE, related_name="supporting_stores")
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("store", "cause")

    def __str__(self) -> str:
        return f"{self.store.display_name} → {self.cause.title}"
