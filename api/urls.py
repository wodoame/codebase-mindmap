from rest_framework.routers import DefaultRouter
from .views import MindMapViewSet

router = DefaultRouter()
router.register(r'mindmaps', MindMapViewSet, basename='mindmap')

urlpatterns = router.urls
