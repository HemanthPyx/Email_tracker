"""
Models for tracking site registrations detected from email scanning.
"""
from django.db import models
from accounts.models import EmailAccount


class SiteRegistration(models.Model):
    """A detected site registration linked to an email account."""
    
    email_account = models.ForeignKey(
        EmailAccount, on_delete=models.CASCADE, related_name='registrations'
    )
    site_name = models.CharField(max_length=255)
    site_domain = models.CharField(max_length=255)
    site_favicon = models.URLField(max_length=500, blank=True, default='')
    
    registered_at = models.DateTimeField(help_text="When the welcome email was received")
    email_subject = models.TextField(blank=True, default='')
    email_from = models.CharField(max_length=255, blank=True, default='')
    gmail_message_id = models.CharField(max_length=255, blank=True, default='')
    
    confidence = models.FloatField(default=0.5, help_text="Detection confidence 0.0 to 1.0")
    is_verified = models.BooleanField(default=False, help_text="User confirmed this is correct")
    is_dismissed = models.BooleanField(default=False, help_text="User dismissed this detection")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('email_account', 'site_domain')
        ordering = ['-registered_at']
    
    def __str__(self):
        return f"{self.site_name} → {self.email_account.email_address}"


class ScanLog(models.Model):
    """Log of each email scanning session."""
    
    STATUS_CHOICES = [
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    email_account = models.ForeignKey(
        EmailAccount, on_delete=models.CASCADE, related_name='scan_logs'
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    emails_processed = models.IntegerField(default=0)
    registrations_found = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='running')
    error_message = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"Scan {self.email_account.email_address} - {self.status} ({self.started_at})"
