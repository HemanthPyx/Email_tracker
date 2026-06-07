"""
Serializers for User and EmailAccount models.
"""
from rest_framework import serializers
from .models import User, EmailAccount


class UserSerializer(serializers.ModelSerializer):
    """Serializer for the User model."""
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'avatar_url', 'date_joined']
        read_only_fields = ['id', 'email', 'date_joined']


class EmailAccountSerializer(serializers.ModelSerializer):
    """Serializer for EmailAccount model."""
    total_registrations = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = EmailAccount
        fields = [
            'id', 'email_address', 'category', 'display_name',
            'last_scanned_at', 'total_registrations', 'is_active',
            'has_auth_error', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'email_address', 'last_scanned_at', 'total_registrations', 'has_auth_error', 'created_at', 'updated_at']


class EmailAccountUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating EmailAccount category/display name."""
    class Meta:
        model = EmailAccount
        fields = ['category', 'display_name']


class GoogleAuthSerializer(serializers.Serializer):
    """Serializer for Google OAuth2 authorization code."""
    code = serializers.CharField(required=True)
    redirect_uri = serializers.CharField(required=False)
    code_verifier = serializers.CharField(required=False, allow_blank=True, allow_null=True)
