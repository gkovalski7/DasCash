from django.contrib.auth import get_user_model
from django.db.models import Sum
from rest_framework import serializers

from apps.causes.models import Cause

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    # Ensure email is required and username is optional; we'll default username=email
    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=False, allow_blank=True, write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(
        choices=[("CONSUMER", "CONSUMER"), ("MERCHANT", "MERCHANT")],
        default="CONSUMER",
    )
    preferred_cause = serializers.PrimaryKeyRelatedField(
        queryset=Cause.objects.filter(is_active=True),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = User
        fields = ("id", "email", "username", "password", "role", "preferred_cause")
        extra_kwargs = {
            "username": {"required": False},
        }

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Ya existe una cuenta con este email.")
        return value

    def validate(self, attrs):
        # Default username to email if not provided
        if not attrs.get("username") and attrs.get("email"):
            attrs["username"] = attrs["email"]
        return super().validate(attrs)

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        if not user.username:
            user.username = user.email
        user.set_password(password)
        user.save()
        return user


class ProfileSerializer(serializers.ModelSerializer):
    total_donated = serializers.SerializerMethodField()
    causes_count = serializers.SerializerMethodField()
    purchases_count = serializers.SerializerMethodField()
    preferred_cause = serializers.PrimaryKeyRelatedField(
        queryset=Cause.objects.filter(is_active=True),
        allow_null=True,
        required=False,
    )
    preferred_cause_title = serializers.CharField(
        source="preferred_cause.title", read_only=True, default=None
    )

    class Meta:
        model = User
        fields = (
            "id", "email", "username", "first_name", "last_name", "role",
            "preferred_cause", "preferred_cause_title",
            "total_donated", "causes_count", "purchases_count",
        )
        read_only_fields = ("id", "email", "role")

    def get_total_donated(self, obj) -> str:
        from apps.cashback.models import CashbackTransaction
        total = CashbackTransaction.objects.filter(user=obj).aggregate(
            total=Sum("amount")
        )["total"]
        return str(total or 0)

    def get_causes_count(self, obj) -> int:
        from apps.cashback.models import CashbackTransaction
        return (
            CashbackTransaction.objects.filter(user=obj, cause__isnull=False)
            .values("cause")
            .distinct()
            .count()
        )

    def get_purchases_count(self, obj) -> int:
        from apps.cashback.models import Purchase
        return Purchase.objects.filter(user=obj).count()


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Las contraseñas no coinciden."})
        return attrs


class DonationSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    cause_title = serializers.CharField()
    cause_slug = serializers.CharField(allow_null=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    status = serializers.CharField()
    store_name = serializers.CharField()
    purchase_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    created_at = serializers.DateTimeField()
