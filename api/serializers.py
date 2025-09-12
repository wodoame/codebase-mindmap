from rest_framework import serializers
from core.models import MindMap

class MindMapSerializer(serializers.ModelSerializer):
    class Meta:
        model = MindMap
        fields = ['id', 'title', 'description', 'data', 'created_at', 'updated_at']
