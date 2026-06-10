from django.conf import settings as django_settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.db import transaction
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers

from .serializers import (
    RegisterSerializer,
    ProfileSerializer,
    DonationSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from .permissions import IsAdmin

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    # Allow login with email instead of username
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make the username field not required so email-only login works
        self.fields[self.username_field].required = False
        self.fields[self.username_field].allow_blank = True

    def validate(self, attrs):
        # If username wasn't provided but email was, map it
        if not attrs.get(self.username_field):
            email = self.initial_data.get("email")
            if email:
                attrs[self.username_field] = email
        return super().validate(attrs)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["username"] = user.username
        return token


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    pass


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({"id": user.id, "email": user.email, "role": user.role}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DonationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from apps.cashback.models import CashbackTransaction

        txs = (
            CashbackTransaction.objects
            .filter(user=request.user)
            .select_related("cause", "purchase__store")
            .order_by("-purchase__created_at")
        )
        data = [
            {
                "id": tx.id,
                "cause_title": tx.cause.title if tx.cause else "Sin causa asignada",
                "cause_slug": tx.cause.slug if tx.cause else None,
                "amount": tx.amount,
                "percentage": tx.percentage,
                "status": tx.status,
                "store_name": tx.purchase.store.display_name,
                "purchase_amount": tx.purchase.amount,
                "created_at": tx.purchase.created_at,
            }
            for tx in txs
        ]
        serializer = DonationSerializer(data, many=True)
        return Response(serializer.data)


_token_generator = PasswordResetTokenGenerator()


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        # Same response regardless of whether the email exists (prevents enumeration)
        ok_msg = "Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña."

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"detail": ok_msg})

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = _token_generator.make_token(user)
        reset_url = f"{django_settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

        nombre = user.first_name or user.username
        send_mail(
            subject="Restablecer contraseña — DasCash",
            message=(
                f"Hola {nombre},\n\n"
                f"Recibimos una solicitud para restablecer tu contraseña.\n\n"
                f"Hacé clic en el siguiente enlace (válido por 1 hora):\n{reset_url}\n\n"
                f"Si no solicitaste esto, podés ignorar este mensaje.\n\n"
                f"Equipo DasCash"
            ),
            from_email=django_settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response({"detail": ok_msg})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data["uid"]
        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        invalid_msg = "El enlace es inválido o ha expirado."

        try:
            pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=pk)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({"detail": invalid_msg}, status=status.HTTP_400_BAD_REQUEST)

        if not _token_generator.check_token(user, token):
            return Response({"detail": invalid_msg}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response({"detail": "Contraseña actualizada correctamente."})


class AdminUserView(APIView):
    """Admin-only endpoint: list users (GET) and create users (POST)."""
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = User.objects.all().order_by('-date_joined')
        role = request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        data = [
            {"id": u.id, "email": u.email, "username": u.username, "role": u.role}
            for u in qs
        ]
        return Response(data)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        merchant_name = request.data.get("merchant_name")
        merchant_cuit = request.data.get("merchant_cuit")

        with transaction.atomic():
            user = serializer.save()

            merchant_data = None
            if merchant_name and merchant_cuit:
                from apps.commerce.models import Merchant
                merchant = Merchant.objects.create(
                    owner=user, name=merchant_name, cuit=merchant_cuit,
                )
                merchant_data = {"id": merchant.id, "name": merchant.name, "cuit": merchant.cuit}

        resp = {"id": user.id, "email": user.email, "username": user.username, "role": user.role}
        if merchant_data:
            resp["merchant"] = merchant_data
        return Response(resp, status=status.HTTP_201_CREATED)
