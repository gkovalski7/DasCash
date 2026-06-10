from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import MerchantViewSet, StoreViewSet, CategoryListView, StoreCausesView, StoreCauseDetailView
from apps.cashback.payment_views import StoreQRView, StoreBySlugView

router = DefaultRouter()
router.register(r"merchants", MerchantViewSet)
router.register(r"stores", StoreViewSet)

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="categories-list"),
    path("stores/by-slug/<str:slug>/", StoreBySlugView.as_view(), name="store-by-slug"),
    path("stores/<int:store_id>/qr/", StoreQRView.as_view(), name="store-qr"),
    path("stores/<int:store_pk>/causes/", StoreCausesView.as_view(), name="store-causes"),
    path("stores/<int:store_pk>/causes/<int:cause_pk>/", StoreCauseDetailView.as_view(), name="store-cause-detail"),
]

urlpatterns += router.urls
