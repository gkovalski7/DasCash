from rest_framework import viewsets, permissions, generics, status as http_status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Prefetch, Q
from django.shortcuts import get_object_or_404
from .models import Merchant, Store, Category, StoreSupportedCause
from .serializers import (
    MerchantSerializer,
    StoreSerializer,
    CategorySerializer,
    StoreSupportedCauseReadSerializer,
    StoreSupportedCauseWriteSerializer,
)
from apps.accounts.permissions import IsAdmin, IsMerchant
from core.pagination import StandardPagination


class IsMerchantOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ("MERCHANT", "ADMIN") or request.user.is_staff


class MerchantViewSet(viewsets.ModelViewSet):
    queryset = Merchant.objects.all()
    serializer_class = MerchantSerializer

    def get_permissions(self):
        if self.request.method in ("GET",):
            return [permissions.IsAuthenticated()]
        return [IsMerchantOrAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == "ADMIN" or user.is_staff:
            return qs
        if user.role == "MERCHANT":
            return qs.filter(owner=user)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        if (user.role == "ADMIN" or user.is_staff) and self.request.data.get("owner"):
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                owner = User.objects.get(pk=self.request.data["owner"])
            except User.DoesNotExist:
                raise PermissionDenied("El usuario owner indicado no existe.")
            if owner.role != "MERCHANT":
                raise PermissionDenied("El owner debe tener rol MERCHANT.")
            serializer.save(owner=owner)
        else:
            serializer.save(owner=user)


class StoreViewSet(viewsets.ModelViewSet):
    queryset = (
        Store.objects.all()
        .prefetch_related("categories", "supported_causes__cause")
        .order_by("display_name", "id")
    )
    serializer_class = StoreSerializer
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.request.method in ("GET",):
            return [permissions.IsAuthenticated()]
        return [IsMerchantOrAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        # Admin sees all stores including inactive
        if not (user.role == "ADMIN" or user.is_staff):
            qs = qs.filter(active=True)

        # Restrict write-scope: merchants see only their own stores
        if self.request.method not in ("GET", "HEAD", "OPTIONS"):
            if not (user.role == "ADMIN" or user.is_staff):
                qs = qs.filter(merchant__owner=user)

        # Filters: search, category (id or slug), participates (true/false)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(Q(display_name__icontains=search) | Q(description__icontains=search))

        category = self.request.query_params.get("category")
        if category:
            if category.isdigit():
                qs = qs.filter(categories__id=int(category))
            else:
                qs = qs.filter(categories__slug=category)

        participates = self.request.query_params.get("participates")
        if participates in {"true", "false"}:
            want_true = participates == "true"
            qs = qs.filter(categories__participates_in_cashback=want_true).distinct()

        return qs.distinct()

    def _validate_merchant_ownership(self, serializer):
        merchant = serializer.validated_data.get("merchant")
        user = self.request.user
        if merchant and not (user.role == "ADMIN" or user.is_staff):
            if merchant.owner != user:
                raise PermissionDenied("No puedes operar con un merchant ajeno.")

    def perform_create(self, serializer):
        self._validate_merchant_ownership(serializer)
        serializer.save()

    def perform_update(self, serializer):
        self._validate_merchant_ownership(serializer)
        serializer.save()


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class StoreCausesView(generics.GenericAPIView):
    """
    GET  /api/commerce/stores/{store_pk}/causes/  — list supported causes (any authenticated user)
    POST /api/commerce/stores/{store_pk}/causes/  — add a cause (merchant owner or admin)
    """

    def _get_store(self):
        return get_object_or_404(Store, pk=self.kwargs["store_pk"])

    def _check_ownership(self, store):
        user = self.request.user
        if user.role == "ADMIN" or user.is_staff:
            return
        if user.role != "MERCHANT" or store.merchant.owner_id != user.pk:
            raise PermissionDenied("No puedes modificar las causas de esta tienda.")

    def get(self, request, store_pk):
        store = self._get_store()
        qs = StoreSupportedCause.objects.filter(store=store).select_related("cause")
        serializer = StoreSupportedCauseReadSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, store_pk):
        store = self._get_store()
        self._check_ownership(store)

        ser = StoreSupportedCauseWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        cause_id = ser.validated_data["cause"]

        from apps.causes.models import Cause

        cause = get_object_or_404(Cause, pk=cause_id, is_active=True)

        if StoreSupportedCause.objects.filter(store=store, cause=cause).exists():
            return Response(
                {"detail": "Esta causa ya está asociada a la tienda."},
                status=http_status.HTTP_409_CONFLICT,
            )

        obj = StoreSupportedCause.objects.create(store=store, cause=cause)
        out = StoreSupportedCauseReadSerializer(obj)
        return Response(out.data, status=http_status.HTTP_201_CREATED)

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.IsAuthenticated()]
        return [(IsMerchant | IsAdmin)()]


class StoreCauseDetailView(generics.GenericAPIView):
    """
    DELETE /api/commerce/stores/{store_pk}/causes/{cause_pk}/  — remove a cause
    """

    def _get_store(self):
        return get_object_or_404(Store, pk=self.kwargs["store_pk"])

    def _check_ownership(self, store):
        user = self.request.user
        if user.role == "ADMIN" or user.is_staff:
            return
        if user.role != "MERCHANT" or store.merchant.owner_id != user.pk:
            raise PermissionDenied("No puedes modificar las causas de esta tienda.")

    def delete(self, request, store_pk, cause_pk):
        store = self._get_store()
        self._check_ownership(store)

        obj = get_object_or_404(StoreSupportedCause, store=store, cause_id=cause_pk)
        obj.delete()
        return Response(status=http_status.HTTP_204_NO_CONTENT)

    def get_permissions(self):
        return [(IsMerchant | IsAdmin)()]
