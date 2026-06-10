from django.urls import path
from .views import (
    LoginView,
    RefreshView,
    register,
    ProfileView,
    DonationsView,
    AdminUserView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

urlpatterns = [
    path("auth/register", register, name="register"),
    path("auth/login", LoginView.as_view(), name="login"),
    path("auth/refresh", RefreshView.as_view(), name="refresh"),
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("profile/donations/", DonationsView.as_view(), name="profile-donations"),
    path("admin/users/", AdminUserView.as_view(), name="admin-users"),
]
