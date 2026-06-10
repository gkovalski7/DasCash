from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.db.models import QuerySet, ProtectedError
from .models import Cause
from .serializers import CauseSerializer
from apps.accounts.permissions import IsAdmin


class CauseViewSet(viewsets.ModelViewSet):
    queryset = Cause.objects.all().order_by("-updated_at")
    serializer_class = CauseSerializer
    lookup_field = "slug"

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAdmin()]

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                {"detail": "No se puede eliminar esta causa porque tiene campañas asociadas."}
            )

    def get_queryset(self) -> QuerySet:
        qs = super().get_queryset()
        request = self.request

        # Non-admin users only see active causes
        if not (request.user.is_authenticated and (request.user.role == "ADMIN" or request.user.is_staff)):
            qs = qs.filter(is_active=True)

        is_featured = request.query_params.get("is_featured")
        category = request.query_params.get("category")
        search = request.query_params.get("search")
        ordering = request.query_params.get("ordering")

        if is_featured is not None:
            val = is_featured.lower() in ("1", "true", "yes", "y")
            qs = qs.filter(is_featured=val)
        if category:
            qs = qs.filter(category__iexact=category)
        if search:
            qs = qs.filter(title__icontains=search) | qs.filter(summary__icontains=search)
        if ordering:
            qs = qs.order_by(ordering)
        limit = request.query_params.get("limit")
        if limit and limit.isdigit():
            qs = qs[: int(limit)]
        return qs
