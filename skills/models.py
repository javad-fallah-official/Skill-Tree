from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

class SkillCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # CSS class or icon name
    
    def __str__(self):
        return self.name

class Skill(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    category = models.ForeignKey(SkillCategory, on_delete=models.CASCADE, related_name='skills')
    cost = models.PositiveIntegerField(default=1)  # Skill points required
    prerequisites = models.ManyToManyField('self', blank=True, symmetrical=False)
    tier = models.PositiveIntegerField(default=1)  # Skill tier/level
    icon = models.CharField(max_length=50, blank=True)
    position_x = models.IntegerField(default=0)  # For visual positioning
    position_y = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['tier', 'name']
    
    def __str__(self):
        return f"{self.name} (Tier {self.tier})"
    
    def can_unlock(self, user):
        """Check if user can unlock this skill"""
        # Check if user has enough skill points
        user_profile = UserProfile.objects.get_or_create(user=user)[0]
        if user_profile.available_skill_points < self.cost:
            return False, "Not enough skill points"
        
        # Check if all prerequisites are unlocked
        for prereq in self.prerequisites.all():
            if not UserSkill.objects.filter(user=user, skill=prereq, unlocked=True).exists():
                return False, f"Requires {prereq.name}"
        
        # Check if already unlocked
        if UserSkill.objects.filter(user=user, skill=self, unlocked=True).exists():
            return False, "Already unlocked"
        
        return True, "Can unlock"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    total_skill_points = models.PositiveIntegerField(default=10)  # Total earned
    spent_skill_points = models.PositiveIntegerField(default=0)   # Points spent
    
    @property
    def available_skill_points(self):
        return self.total_skill_points - self.spent_skill_points
    
    def add_skill_points(self, points):
        self.total_skill_points += points
        self.save()
    
    def __str__(self):
        return f"{self.user.username} - {self.available_skill_points} points available"

class UserSkill(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    unlocked = models.BooleanField(default=False)
    unlocked_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['user', 'skill']
    
    def __str__(self):
        status = "Unlocked" if self.unlocked else "Locked"
        return f"{self.user.username} - {self.skill.name} ({status})"
