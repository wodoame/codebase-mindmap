from rest_framework.routers import DefaultRouter
from .views import MindMapViewSet, Test, LinkPreview
from django.urls import path

router = DefaultRouter()
router.register(r'mindmaps', MindMapViewSet, basename='mindmap') 

urlpatterns = [
    path('test/', Test.as_view(), name='api-test'),
    path('link-preview/', LinkPreview.as_view(), name='api-link-preview')
    
] +  router.urls
