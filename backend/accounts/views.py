"""
Views for authentication and email account management.
"""
import os
import json
from datetime import datetime, timezone

from django.conf import settings
from rest_framework import status, generics, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from google_auth_oauthlib.flow import Flow

from .models import User, EmailAccount
from .serializers import (
    UserSerializer, EmailAccountSerializer, 
    EmailAccountUpdateSerializer, GoogleAuthSerializer
)


# Google OAuth2 scopes
GOOGLE_SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/gmail.readonly',
]


def get_google_flow(redirect_uri=None):
    """Create a Google OAuth2 flow instance."""
    client_config = {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [redirect_uri or settings.GOOGLE_REDIRECT_URI],
        }
    }
    flow = Flow.from_client_config(
        client_config,
        scopes=GOOGLE_SCOPES,
        redirect_uri=redirect_uri or settings.GOOGLE_REDIRECT_URI,
    )
    return flow


@api_view(['GET'])
@permission_classes([AllowAny])
def google_auth_url(request):
    """Generate Google OAuth2 authorization URL."""
    redirect_uri = request.query_params.get('redirect_uri', settings.GOOGLE_REDIRECT_URI)
    flow = get_google_flow(redirect_uri)
    auth_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
    )
    return Response({
        'auth_url': auth_url,
        'state': state,
        'code_verifier': getattr(flow, 'code_verifier', None),
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth_callback(request):
    """Handle Google OAuth2 callback with authorization code."""
    serializer = GoogleAuthSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    code = serializer.validated_data['code']
    redirect_uri = serializer.validated_data.get('redirect_uri', settings.GOOGLE_REDIRECT_URI)
    code_verifier = serializer.validated_data.get('code_verifier')
    
    try:
        flow = get_google_flow(redirect_uri)
        if code_verifier:
            flow.fetch_token(code=code, code_verifier=code_verifier)
        else:
            flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Get user info from Google
        import google.auth.transport.requests
        from googleapiclient.discovery import build
        
        service = build('oauth2', 'v2', credentials=credentials)
        user_info = service.userinfo().get().execute()
        
        google_id = user_info.get('id')
        email = user_info.get('email')
        first_name = user_info.get('given_name', '')
        last_name = user_info.get('family_name', '')
        avatar_url = user_info.get('picture', '')
        
        # Create or update user
        user, created = User.objects.update_or_create(
            google_id=google_id,
            defaults={
                'email': email,
                'username': email.split('@')[0],
                'first_name': first_name,
                'last_name': last_name,
                'avatar_url': avatar_url,
            }
        )
        
        # Create or update email account
        defaults = {
            'access_token': credentials.token,
            'token_expiry': credentials.expiry,
            'display_name': f"{first_name}'s Gmail" if first_name else email,
            'is_active': True,
            'has_auth_error': False,
        }
        if credentials.refresh_token:
            defaults['refresh_token'] = credentials.refresh_token

        email_account, _ = EmailAccount.objects.update_or_create(
            user=user,
            email_address=email,
            defaults=defaults
        )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Authentication failed: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get the current authenticated user."""
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def connect_email(request):
    """Connect an additional Gmail account."""
    serializer = GoogleAuthSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    code = serializer.validated_data['code']
    redirect_uri = serializer.validated_data.get('redirect_uri', settings.GOOGLE_REDIRECT_URI)
    code_verifier = serializer.validated_data.get('code_verifier')
    
    try:
        flow = get_google_flow(redirect_uri)
        if code_verifier:
            flow.fetch_token(code=code, code_verifier=code_verifier)
        else:
            flow.fetch_token(code=code)
        credentials = flow.credentials
        
        from googleapiclient.discovery import build
        service = build('oauth2', 'v2', credentials=credentials)
        user_info = service.userinfo().get().execute()
        
        email = user_info.get('email')
        first_name = user_info.get('given_name', '')
        
        defaults = {
            'access_token': credentials.token,
            'token_expiry': credentials.expiry,
            'display_name': f"{first_name}'s Gmail" if first_name else email,
            'is_active': True,
            'has_auth_error': False,
        }
        if credentials.refresh_token:
            defaults['refresh_token'] = credentials.refresh_token

        email_account, created = EmailAccount.objects.update_or_create(
            user=request.user,
            email_address=email,
            defaults=defaults
        )
        
        return Response({
            'email_account': EmailAccountSerializer(email_account).data,
            'created': created,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to connect email: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


class EmailAccountViewSet(viewsets.ModelViewSet):
    """ViewSet for managing email accounts."""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return EmailAccountUpdateSerializer
        return EmailAccountSerializer
    
    def get_queryset(self):
        return EmailAccount.objects.filter(user=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Disconnect an email account."""
        instance = self.get_object()
        instance.is_active = False
        instance.access_token = ''
        instance.refresh_token = ''
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
