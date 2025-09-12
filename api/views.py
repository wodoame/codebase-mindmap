from rest_framework import viewsets
from core.models import MindMap
from .serializers import MindMapSerializer
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
# MindMap API CRUD endpoints
class MindMapViewSet(viewsets.ModelViewSet):
	queryset = MindMap.objects.all()
	serializer_class = MindMapSerializer

class Test(APIView):
    def post(self, request: Request):
        print(request.data)
        return Response({'message': 'successful'})