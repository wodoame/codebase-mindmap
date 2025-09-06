from django.shortcuts import render
from django.views import View

class Index(View):
    def get(self, request):
        context = {}
        return render(request, 'core/pages/base.html', context)

class Sandbox(View):
    # ? Random testing area
    def get(self, request):
        context = {}
        return render(request, 'core/pages/sandbox/test.html', context)