from django.shortcuts import render
from django.views import View

class TestView(View):
    def get(self, request):
        context = {}
        return render(request, 'pages/test.html', context)
