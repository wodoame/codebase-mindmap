"""
URL configuration for codebase_mindmap project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
import core.views as core_views
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include("django_components.urls")),
    path('', core_views.Index.as_view(), name='index'),
    path('maps/<int:mindmap_id>/', core_views.MindMapEditor.as_view(), name='editor'),
    path('maps/<int:mindmap_id>/delete/', core_views.DeleteMindMap.as_view(), name='mindmap-delete'),
    path('maps/', core_views.MindMaps.as_view(), name='mindmaps'),
    path('maps/new/', core_views.CreateMindMap.as_view(), name='mindmap-create'),
    path('api/', include('api.urls')),
]
