from rest_framework.routers import DefaultRouter
from .views import CauseViewSet

router = DefaultRouter()
router.register(r"causes", CauseViewSet, basename="cause")

urlpatterns = router.urls
