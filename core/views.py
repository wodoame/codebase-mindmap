from django.shortcuts import render, redirect
from django.views import View
from .models import MindMap
from .forms import MindMapForm

class Index(View):
    def get(self, request):
        context = {}
        return render(request, 'core/pages/base.html', context)

class Sandbox(View):
    # ? Random testing area
    def get(self, request):
        mindmaps = MindMap.objects.order_by('-updated_at')
        context = {"mindmaps": mindmaps}
        return render(request, 'core/pages/sandbox.html', context)

class MindMapEditor(View):
    def get(self, request, mindmap_id):
        context = {"mindmap_id": mindmap_id}
        # Pass mindmap_id to template for meta tag
        return render(request, 'core/pages/base.html', context)

class CreateMindMap(View):
    def get(self, request):
        form = MindMapForm()
        return render(request, 'core/pages/mindmaps/create.html', {"form": form})

    def post(self, request):
        form = MindMapForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('editor')  # '/test/' route
        return render(request, 'core/pages/mindmaps/create.html', {"form": form})
    
class MinMaps(View):
    def get(self, request):
        mindmaps = MindMap.objects.order_by('-updated_at')
        context = {"mindmaps": mindmaps}
        return render(request, 'core/pages/mindmaps.html', context)