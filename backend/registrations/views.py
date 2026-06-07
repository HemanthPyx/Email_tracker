"""
Views for site registrations, scanning, and dashboard.
"""
from django.db.models import Count, Q
from django.utils import timezone as tz
from rest_framework import status, viewsets, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import EmailAccount
from .models import SiteRegistration, ScanLog
from .serializers import (
    SiteRegistrationSerializer, ScanLogSerializer, DashboardStatsSerializer
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics for the current user."""
    user = request.user
    accounts = EmailAccount.objects.filter(user=user, is_active=True)
    
    # Total counts
    total_accounts = accounts.count()
    total_registrations = SiteRegistration.objects.filter(
        email_account__in=accounts, is_dismissed=False
    ).count()
    
    # Registrations by category
    registrations_by_category = (
        SiteRegistration.objects.filter(
            email_account__in=accounts, is_dismissed=False
        )
        .values('email_account__category')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    category_data = [
        {'category': item['email_account__category'], 'count': item['count']}
        for item in registrations_by_category
    ]
    
    # Recent registrations
    recent = SiteRegistration.objects.filter(
        email_account__in=accounts, is_dismissed=False
    ).select_related('email_account')[:10]
    
    # Last scan
    last_scan = ScanLog.objects.filter(
        email_account__in=accounts
    ).first()
    
    accounts_with_errors_count = accounts.filter(has_auth_error=True).count()
    
    data = {
        'total_accounts': total_accounts,
        'total_registrations': total_registrations,
        'registrations_by_category': category_data,
        'recent_registrations': SiteRegistrationSerializer(recent, many=True).data,
        'last_scan': ScanLogSerializer(last_scan).data if last_scan else None,
        'accounts_with_errors_count': accounts_with_errors_count,
    }
    
    return Response(data)


class SiteRegistrationViewSet(viewsets.ModelViewSet):
    """ViewSet for site registrations with search and filter."""
    serializer_class = SiteRegistrationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['site_name', 'site_domain', 'email_from']
    ordering_fields = ['registered_at', 'site_name', 'confidence', 'created_at']
    ordering = ['-registered_at']
    
    def get_queryset(self):
        queryset = SiteRegistration.objects.filter(
            email_account__user=self.request.user,
            is_dismissed=False,
        ).select_related('email_account')
        
        # Filter by email account
        email_account_id = self.request.query_params.get('email_account')
        if email_account_id:
            queryset = queryset.filter(email_account_id=email_account_id)
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(email_account__category=category)
        
        # Filter by confidence
        min_confidence = self.request.query_params.get('min_confidence')
        if min_confidence:
            queryset = queryset.filter(confidence__gte=float(min_confidence))
        
        # Filter by verified status
        verified = self.request.query_params.get('verified')
        if verified is not None:
            queryset = queryset.filter(is_verified=verified.lower() == 'true')
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Mark a registration as verified by the user."""
        registration = self.get_object()
        registration.is_verified = True
        registration.save()
        return Response(SiteRegistrationSerializer(registration).data)
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss a false detection."""
        registration = self.get_object()
        registration.is_dismissed = True
        registration.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ScanLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing scan history."""
    serializer_class = ScanLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ScanLog.objects.filter(
            email_account__user=self.request.user
        ).select_related('email_account')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_scan(request):
    """Trigger a manual email scan for a specific account or all accounts."""
    email_account_id = request.data.get('email_account_id')
    
    if email_account_id:
        accounts = EmailAccount.objects.filter(
            id=email_account_id, user=request.user, is_active=True
        )
    else:
        accounts = EmailAccount.objects.filter(user=request.user, is_active=True)
    
    if not accounts.exists():
        return Response(
            {'error': 'No active email accounts found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Import scanner and run synchronously for now (Celery can be added later)
    from scanner.gmail_client import GmailScanner
    
    results = []
    for account in accounts:
        try:
            scanner = GmailScanner(account)
            scan_result = scanner.scan()
            results.append({
                'email': account.email_address,
                'status': 'completed',
                'emails_processed': scan_result.get('emails_processed', 0),
                'registrations_found': scan_result.get('registrations_found', 0),
            })
        except Exception as e:
            results.append({
                'email': account.email_address,
                'status': 'failed',
                'error': str(e),
            })
    
    return Response({'results': results})
