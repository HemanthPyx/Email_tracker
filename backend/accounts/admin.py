from django.contrib import admin
from .models import User, EmailAccount

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'username', 'first_name', 'last_name', 'date_joined']
    search_fields = ['email', 'username']

@admin.register(EmailAccount)
class EmailAccountAdmin(admin.ModelAdmin):
    list_display = ['email_address', 'user', 'category', 'total_registrations', 'last_scanned_at']
    list_filter = ['category', 'is_active']
    search_fields = ['email_address']
