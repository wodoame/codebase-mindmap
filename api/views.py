from rest_framework import viewsets
from core.models import MindMap
from .serializers import MindMapSerializer

# MindMap API CRUD endpoints
class MindMapViewSet(viewsets.ModelViewSet):
	queryset = MindMap.objects.all()
	serializer_class = MindMapSerializer
