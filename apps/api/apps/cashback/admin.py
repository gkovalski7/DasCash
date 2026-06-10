from django.contrib import admin
from .models import Campaign, CampaignStore, Purchase, CashbackTransaction, ReceiptUpload


class CampaignStoreInline(admin.TabularInline):
    model = CampaignStore
    extra = 1


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "cause", "percentage", "active", "starts_at", "ends_at")
    inlines = [CampaignStoreInline]


@admin.register(CampaignStore)
class CampaignStoreAdmin(admin.ModelAdmin):
    list_display = ("id", "campaign", "store", "cashback_percentage")


@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "store", "amount", "status", "selected_cause", "created_at")


@admin.register(CashbackTransaction)
class CashbackTransactionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "purchase", "campaign", "cause", "amount", "status")


@admin.register(ReceiptUpload)
class ReceiptUploadAdmin(admin.ModelAdmin):
    list_display = ("id", "purchase", "ocr_status")



