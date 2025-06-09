from django.contrib import admin
from django.urls import path
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import SkillCategory, Skill, UserProfile, UserSkill
import json

@admin.register(SkillCategory)
class SkillCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'tier', 'cost', 'position_x', 'position_y']
    list_filter = ['category', 'tier']
    filter_horizontal = ['prerequisites']
    search_fields = ['name', 'description']
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('skill-tree-editor/', self.admin_site.admin_view(self.skill_tree_editor), name='skill_tree_editor'),
            path('update-skill-position/', self.admin_site.admin_view(self.update_skill_position), name='update_skill_position'),
            path('create-skill-ajax/', self.admin_site.admin_view(self.create_skill_ajax), name='create_skill_ajax'),
            path('update-skill-ajax/<int:skill_id>/', self.admin_site.admin_view(self.update_skill_ajax), name='update_skill_ajax'),
            path('delete-skill-ajax/<int:skill_id>/', self.admin_site.admin_view(self.delete_skill_ajax), name='delete_skill_ajax'),
        ]
        return custom_urls + urls
    
    def skill_tree_editor(self, request):
        """Interactive skill tree editor"""
        categories = SkillCategory.objects.all()
        skills = Skill.objects.select_related('category').prefetch_related('prerequisites').all()
        
        context = {
            'title': 'Interactive Skill Tree Editor',
            'categories': categories,
            'skills': skills,
            'opts': self.model._meta,
        }
        return render(request, 'admin/skills/skill_tree_editor.html', context)
    
    @csrf_exempt
    def update_skill_position(self, request):
        """Update skill position via AJAX"""
        if request.method == 'POST':
            data = json.loads(request.body)
            skill_id = data.get('skill_id')
            x = data.get('x')
            y = data.get('y')
            
            try:
                skill = Skill.objects.get(id=skill_id)
                skill.position_x = x
                skill.position_y = y
                skill.save()
                return JsonResponse({'success': True})
            except Skill.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Skill not found'})
        
        return JsonResponse({'success': False, 'error': 'Invalid request'})
    
    @csrf_exempt
    def create_skill_ajax(self, request):
        """Create new skill via AJAX"""
        if request.method == 'POST':
            data = json.loads(request.body)
            try:
                skill = Skill.objects.create(
                    name=data.get('name', 'New Skill'),
                    description=data.get('description', ''),
                    category_id=data.get('category_id'),
                    cost=data.get('cost', 1),
                    tier=data.get('tier', 1),
                    position_x=data.get('x', 0),
                    position_y=data.get('y', 0),
                )
                
                # Set prerequisites
                prerequisites = data.get('prerequisites', [])
                if prerequisites:
                    skill.prerequisites.set(prerequisites)
                
                return JsonResponse({
                    'success': True,
                    'skill': {
                        'id': skill.id,
                        'name': skill.name,
                        'description': skill.description,
                        'cost': skill.cost,
                        'tier': skill.tier,
                        'category': skill.category.name,
                    }
                })
            except Exception as e:
                return JsonResponse({'success': False, 'error': str(e)})
        
        return JsonResponse({'success': False, 'error': 'Invalid request'})
    
    @csrf_exempt
    def update_skill_ajax(self, request, skill_id):
        """Update skill via AJAX"""
        if request.method == 'POST':
            data = json.loads(request.body)
            try:
                skill = Skill.objects.get(id=skill_id)
                skill.name = data.get('name', skill.name)
                skill.description = data.get('description', skill.description)
                skill.category_id = data.get('category_id', skill.category_id)
                skill.cost = data.get('cost', skill.cost)
                skill.tier = data.get('tier', skill.tier)
                skill.save()
                
                # Update prerequisites
                prerequisites = data.get('prerequisites', [])
                skill.prerequisites.set(prerequisites)
                
                return JsonResponse({'success': True})
            except Skill.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Skill not found'})
            except Exception as e:
                return JsonResponse({'success': False, 'error': str(e)})
        
        return JsonResponse({'success': False, 'error': 'Invalid request'})
    
    @csrf_exempt
    def delete_skill_ajax(self, request, skill_id):
        """Delete skill via AJAX"""
        if request.method == 'DELETE':
            try:
                skill = Skill.objects.get(id=skill_id)
                skill.delete()
                return JsonResponse({'success': True})
            except Skill.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Skill not found'})
        
        return JsonResponse({'success': False, 'error': 'Invalid request'})

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_skill_points', 'spent_skill_points', 'available_skill_points']
    search_fields = ['user__username']

@admin.register(UserSkill)
class UserSkillAdmin(admin.ModelAdmin):
    list_display = ['user', 'skill', 'unlocked', 'unlocked_at']
    list_filter = ['unlocked', 'skill__category']
    search_fields = ['user__username', 'skill__name']
