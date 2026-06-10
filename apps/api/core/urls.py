from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.accounts.urls")),
    path("api/commerce/", include("apps.commerce.urls")),
    path("api/cashback/", include("apps.cashback.urls")),
    path("api/", include("apps.causes.urls")),
]
