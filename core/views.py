from django.shortcuts import render
from django.views import View

class Index(View):
    def get(self, request):
        context = {}
        return render(request, 'core/pages/base.html', context)

class Editor(View):
    def get(self, request):
        context = {}
        return render(request, 'core/pages/test.html', context)