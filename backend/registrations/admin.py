from django.contrib import admin
from .models import SiteRegistration, ScanLog

@admin.register(SiteRegistration)
class SiteRegistrationAdmin(admin.ModelAdmin):
    list_display = ['site_name', 'site_domain', 'email_account', 'confidence', 'registered_at', 'is_verified']
    list_filter = ['is_verified', 'is_dismissed', 'confidence']
    search_fields = ['site_name', 'site_domain']

@admin.register(ScanLog)
class ScanLogAdmin(admin.ModelAdmin):
    list_display = ['email_account', 'status', 'emails_processed', 'registrations_found', 'started_at']
    list_filter = ['status']
