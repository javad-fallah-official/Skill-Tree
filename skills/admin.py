from django.contrib import admin
from .models import SkillCategory, Skill, UserProfile, UserSkill

@admin.register(SkillCategory)
class SkillCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'tier', 'cost']
    list_filter = ['category', 'tier']
    filter_horizontal = ['prerequisites']

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_skill_points', 'spent_skill_points', 'available_skill_points']

@admin.register(UserSkill)
class UserSkillAdmin(admin.ModelAdmin):
    list_display = ['user', 'skill', 'unlocked', 'unlocked_at']
    list_filter = ['unlocked', 'skill__category']
