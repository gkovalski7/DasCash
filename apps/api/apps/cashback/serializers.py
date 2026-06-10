from decimal import Decimal

from django.db.models import Q
from rest_framework import serializers
from .models import Campaign, CampaignStore, Purchase, CashbackTransaction, ReceiptUpload


class CampaignStoreSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source="store.display_name", read_only=True)
    effective_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = CampaignStore
        fields = ("id", "store", "store_name", "cashback_percentage", "effective_percentage")


class CampaignSerializer(serializers.ModelSerializer):
    campaign_stores = CampaignStoreSerializer(many=True, read_only=True)
    cause_title = serializers.CharField(source="cause.title", read_only=True)
    store_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True,
        help_text="Lista de IDs de tiendas a vincular",
    )

    class Meta:
        model = Campaign
        fields = (
            "id", "name", "cause", "cause_title", "percentage",
            "starts_at", "ends_at", "active",
            "campaign_stores", "store_ids",
        )

    # ── field-level validators ────────────────────────────────────────

    def validate_percentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("El porcentaje debe estar entre 0 y 100.")
        return value

    def validate_store_ids(self, value):
        if not value:
            raise serializers.ValidationError("Debe incluir al menos una tienda.")
        from apps.commerce.models import Store
        existing = set(Store.objects.filter(id__in=value, active=True).values_list("id", flat=True))
        missing = set(value) - existing
        if missing:
            raise serializers.ValidationError(f"Tiendas no encontradas o inactivas: {missing}")
        return value

    # ── object-level validate ─────────────────────────────────────────

    def validate(self, attrs):
        # --- date range ---
        starts_at = attrs.get("starts_at") or (self.instance.starts_at if self.instance else None)
        ends_at = attrs.get("ends_at") or (self.instance.ends_at if self.instance else None)
        if starts_at and ends_at and starts_at >= ends_at:
            raise serializers.ValidationError({"ends_at": "La fecha de fin debe ser posterior a la de inicio."})

        # --- overlap check (only for active campaigns) ---
        active = attrs.get("active", self.instance.active if self.instance else True)
        store_ids = attrs.get("store_ids")
        if active and store_ids and starts_at and ends_at:
            # Find active campaigns that overlap [starts_at, ends_at]
            overlap_qs = CampaignStore.objects.filter(
                store_id__in=store_ids,
                campaign__active=True,
                campaign__starts_at__lt=ends_at,
                campaign__ends_at__gt=starts_at,
            )
            # Exclude self when editing
            if self.instance:
                overlap_qs = overlap_qs.exclude(campaign=self.instance)

            conflicting = overlap_qs.select_related("campaign", "store")
            if conflicting.exists():
                details = []
                for cs in conflicting[:5]:
                    details.append(f"{cs.store.display_name} ya en \"{cs.campaign.name}\"")
                raise serializers.ValidationError({
                    "store_ids": f"Solapamiento con campañas activas: {'; '.join(details)}."
                })

        return attrs

    def create(self, validated_data):
        store_ids = validated_data.pop("store_ids")
        campaign = Campaign.objects.create(**validated_data)
        CampaignStore.objects.bulk_create([
            CampaignStore(campaign=campaign, store_id=sid) for sid in store_ids
        ])
        return campaign

    def update(self, instance, validated_data):
        store_ids = validated_data.pop("store_ids", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if store_ids is not None:
            instance.campaign_stores.all().delete()
            CampaignStore.objects.bulk_create([
                CampaignStore(campaign=instance, store_id=sid) for sid in store_ids
            ])
        return instance


class PurchaseSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source="store.display_name", read_only=True)
    cause_title = serializers.CharField(source="selected_cause.title", read_only=True, default=None)

    class Meta:
        model = Purchase
        fields = "__all__"
        read_only_fields = ("user", "status")

    def validate(self, attrs):
        """Validate selected_cause against the store's supported causes.

        REGLA DE NEGOCIO: selected_cause es la preferencia informativa del
        consumidor. El cashback real se asigna a campaign.cause al aprobar.
        Si la tienda tiene 2+ causas y el consumer no elige, queda null.
        """
        store = attrs.get("store") or (self.instance.store if self.instance else None)
        selected_cause = attrs.get("selected_cause")

        if store:
            from apps.commerce.models import StoreSupportedCause

            supported = StoreSupportedCause.objects.filter(store=store).select_related("cause")
            count = supported.count()

            if count == 0:
                if selected_cause is not None:
                    raise serializers.ValidationError(
                        {"selected_cause": "Esta tienda no tiene causas asignadas."}
                    )
            elif count == 1:
                if selected_cause is None:
                    attrs["selected_cause"] = supported.first().cause
                elif not supported.filter(cause=selected_cause).exists():
                    raise serializers.ValidationError(
                        {"selected_cause": "La causa seleccionada no pertenece a esta tienda."}
                    )
            else:
                if selected_cause is not None:
                    if not supported.filter(cause=selected_cause).exists():
                        raise serializers.ValidationError(
                            {"selected_cause": "La causa seleccionada no pertenece a esta tienda."}
                        )

        return attrs


class CashbackTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CashbackTransaction
        fields = "__all__"
        read_only_fields = ("user",)


class ReceiptUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReceiptUpload
        fields = "__all__"



