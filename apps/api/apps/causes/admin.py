from django.contrib import admin
from .models import Cause


@admin.register(Cause)
class CauseAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "category", "is_active", "is_featured")
    list_filter = ("category", "is_active", "is_featured")
    search_fields = ("title",)
    prepopulated_fields = {"slug": ("title",)}
