from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('django.contrib.auth.urls')),
    path('skills/', include('skills.urls')),
    path('', lambda request: redirect('skill_tree')),
]
