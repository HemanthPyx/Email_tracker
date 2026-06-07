"""
Custom User model and EmailAccount model for managing connected Gmail accounts.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with Google OAuth fields."""
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    avatar_url = models.URLField(max_length=500, blank=True, default='')
    
    # Override email to make it unique
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.email


class EmailAccount(models.Model):
    """A connected Gmail account that we scan for registrations."""
    
    CATEGORY_CHOICES = [
        ('personal', 'Personal'),
        ('work', 'Work'),
        ('gaming', 'Gaming'),
        ('shopping', 'Shopping'),
        ('social', 'Social Media'),
        ('finance', 'Finance'),
        ('education', 'Education'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_accounts')
    email_address = models.EmailField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='personal')
    display_name = models.CharField(max_length=255, blank=True, default='')
    
    # OAuth2 tokens (encrypted in production)
    access_token = models.TextField(blank=True, default='')
    refresh_token = models.TextField(blank=True, default='')
    token_expiry = models.DateTimeField(null=True, blank=True)
    
    # Scanning metadata
    last_scanned_at = models.DateTimeField(null=True, blank=True)
    total_registrations = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    has_auth_error = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'email_address')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.email_address} ({self.category})"
