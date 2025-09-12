from rest_framework.routers import DefaultRouter
from .views import MindMapViewSet, Test
from django.urls import path

router = DefaultRouter()
router.register(r'mindmaps', MindMapViewSet, basename='mindmap') 

urlpatterns = [
    path('test/', Test.as_view(), name='api-test')
    
] +  router.urls
