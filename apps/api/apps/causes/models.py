from django.db import models
from django.utils.text import slugify


class Cause(models.Model):
    CATEGORY_CHOICES = [
        ("Deporte", "Deporte"),
        ("Educación", "Educación"),
        ("Salud", "Salud"),
        ("Ambiente", "Ambiente"),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default="Educación")
    summary = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:220]
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover
        return self.title
