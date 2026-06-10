from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsConsumer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "CONSUMER"


class IsMerchant(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "MERCHANT"


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_staff or request.user.role == "ADMIN")


class ReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS
