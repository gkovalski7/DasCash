from rest_framework import serializers
from .models import Merchant, Store, Category, StoreSupportedCause


class MerchantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Merchant
        fields = "__all__"
        read_only_fields = ("owner",)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "participates_in_cashback")


class StoreSupportedCauseReadSerializer(serializers.ModelSerializer):
    cause_id = serializers.IntegerField(source="cause.id")
    title = serializers.CharField(source="cause.title")
    slug = serializers.SlugField(source="cause.slug")
    category = serializers.CharField(source="cause.category")

    class Meta:
        model = StoreSupportedCause
        fields = ("id", "cause_id", "title", "slug", "category", "added_at")
        read_only_fields = fields


class StoreSupportedCauseWriteSerializer(serializers.Serializer):
    cause = serializers.IntegerField()


class StoreSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    supported_causes = StoreSupportedCauseReadSerializer(many=True, read_only=True)
    has_excluded_categories = serializers.SerializerMethodField()
    excluded_categories = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = (
            "id",
            "merchant",
            "display_name",
            "address",
            "qrcode_slug",
            "description",
            "logo_url",
            "website_url",
            "instagram_url",
            "active",
            "categories",
            "supported_causes",
            "has_excluded_categories",
            "excluded_categories",
        )

    def get_has_excluded_categories(self, obj: Store) -> bool:
        return any(not c.participates_in_cashback for c in getattr(obj, "_prefetched_objects_cache", {}).get("categories", obj.categories.all()))

    def get_excluded_categories(self, obj: Store):
        cats = getattr(obj, "_prefetched_objects_cache", {}).get("categories", obj.categories.all())
        return [c.name for c in cats if not c.participates_in_cashback]
