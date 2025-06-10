from django.urls import path
from . import views

urlpatterns = [
    path('', views.skill_tree, name='skill_tree'),
    path('unlock/<int:skill_id>/', views.unlock_skill, name='unlock_skill'),
    path('add-points/', views.add_skill_points, name='add_skill_points'),
    path('register/', views.register, name='register'),  # Add this line
    path('reset/', views.reset_skills, name='reset_skills'),
]