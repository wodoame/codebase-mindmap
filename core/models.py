from django.db import models

class MindMap(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    data = models.JSONField(default=dict)  # Store mind map data as JSON
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title