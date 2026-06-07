"""
Serializers for SiteRegistration and ScanLog models.
"""
from rest_framework import serializers
from .models import SiteRegistration, ScanLog


class SiteRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for site registrations."""
    email_address = serializers.CharField(source='email_account.email_address', read_only=True)
    email_category = serializers.CharField(source='email_account.category', read_only=True)
    
    class Meta:
        model = SiteRegistration
        fields = [
            'id', 'site_name', 'site_domain', 'site_favicon',
            'registered_at', 'email_subject', 'email_from',
            'gmail_message_id', 'confidence', 'is_verified',
            'is_dismissed', 'email_address', 'email_category',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'site_name', 'site_domain', 'site_favicon',
            'registered_at', 'email_subject', 'email_from',
            'gmail_message_id', 'confidence', 'email_address',
            'email_category', 'created_at', 'updated_at'
        ]


class ScanLogSerializer(serializers.ModelSerializer):
    """Serializer for scan logs."""
    email_address = serializers.CharField(source='email_account.email_address', read_only=True)
    
    class Meta:
        model = ScanLog
        fields = [
            'id', 'email_address', 'started_at', 'completed_at',
            'emails_processed', 'registrations_found', 'status',
            'error_message'
        ]
        read_only_fields = [
            'id', 'email_address', 'started_at', 'completed_at',
            'emails_processed', 'registrations_found', 'status',
            'error_message'
        ]


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics."""
    total_accounts = serializers.IntegerField()
    total_registrations = serializers.IntegerField()
    registrations_by_category = serializers.ListField()
    recent_registrations = SiteRegistrationSerializer(many=True)
    last_scan = ScanLogSerializer(allow_null=True)
