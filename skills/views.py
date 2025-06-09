from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.utils import timezone
from .models import Skill, SkillCategory, UserProfile, UserSkill
from django.db import transaction
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login

@login_required
def skill_tree(request):
    """Main skill tree view"""
    categories = SkillCategory.objects.prefetch_related('skills').all()
    user_profile, created = UserProfile.objects.get_or_create(user=request.user)
    user_skills = UserSkill.objects.filter(user=request.user, unlocked=True).values_list('skill_id', flat=True)
    
    # Add unlock status to each skill
    for category in categories:
        for skill in category.skills.all():
            skill.is_unlocked = skill.id in user_skills
            skill.can_unlock_status, skill.unlock_message = skill.can_unlock(request.user)
    
    context = {
        'categories': categories,
        'user_profile': user_profile,
        'user_skills': user_skills,
    }
    return render(request, 'skills/skill_tree.html', context)

@login_required
def unlock_skill(request, skill_id):
    """Unlock a specific skill"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
    
    skill = get_object_or_404(Skill, id=skill_id)
    user_profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    # Check if skill can be unlocked
    can_unlock, message = skill.can_unlock(request.user)
    
    if not can_unlock:
        return JsonResponse({'success': False, 'message': message})
    
    # Unlock the skill
    with transaction.atomic():
        user_skill, created = UserSkill.objects.get_or_create(
            user=request.user,
            skill=skill,
            defaults={'unlocked': True, 'unlocked_at': timezone.now()}
        )
        
        if not created and not user_skill.unlocked:
            user_skill.unlocked = True
            user_skill.unlocked_at = timezone.now()
            user_skill.save()
        
        # Deduct skill points
        user_profile.spent_skill_points += skill.cost
        user_profile.save()
    
    return JsonResponse({
        'success': True, 
        'message': f'Successfully unlocked {skill.name}!',
        'remaining_points': user_profile.available_skill_points
    })

@login_required
def add_skill_points(request):
    """Admin function to add skill points (for testing)"""
    if request.method == 'POST':
        points = int(request.POST.get('points', 1))
        user_profile, created = UserProfile.objects.get_or_create(user=request.user)
        user_profile.add_skill_points(points)
        messages.success(request, f'Added {points} skill points!')
    
    return redirect('skill_tree')

def register(request):
    """User registration view"""
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Create user profile with initial skill points
            UserProfile.objects.create(user=user, total_skill_points=10)
            login(request, user)
            messages.success(request, 'Registration successful! Welcome to the Skill Tree!')
            return redirect('skill_tree')
    else:
        form = UserCreationForm()
    
    return render(request, 'registration/register.html', {'form': form})
