"""
Gmail API client for scanning emails and detecting site registrations.
"""
import re
import logging
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

from django.conf import settings
from django.utils import timezone as tz
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build

from accounts.models import EmailAccount
from registrations.models import SiteRegistration, ScanLog
from .detector import RegistrationDetector

logger = logging.getLogger(__name__)


class GmailScanner:
    """Scans a Gmail account for registration/welcome emails."""
    
    # Search query to find registration-like emails
    SEARCH_QUERY = (
        'subject:('
        '"welcome to" OR "thanks for signing up" OR "verify your email" OR '
        '"confirm your account" OR "account created" OR "registration" OR '
        '"get started" OR "you\'re in" OR "welcome aboard" OR '
        '"activate your account" OR "confirm your registration" OR '
        '"thanks for registering" OR "verify your account" OR '
        '"successful registration" OR "new account" OR '
        '"thanks for joining" OR "confirm your email"'
        ')'
    )
    
    def __init__(self, email_account: EmailAccount):
        self.email_account = email_account
        self.detector = RegistrationDetector()
        self.service = None
    
    def _get_credentials(self):
        """Get valid Google credentials, refreshing if necessary."""
        from google.auth.exceptions import RefreshError
        
        creds = Credentials(
            token=self.email_account.access_token,
            refresh_token=self.email_account.refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
        )
        
        try:
            if creds.expired and creds.refresh_token:
                creds.refresh(GoogleRequest())
                # Update stored tokens
                self.email_account.access_token = creds.token
                self.email_account.token_expiry = creds.expiry
                self.email_account.has_auth_error = False
                self.email_account.save(update_fields=['access_token', 'token_expiry', 'has_auth_error'])
        except RefreshError as e:
            logger.error(f"Refresh token expired or invalid for {self.email_account.email_address}: {e}")
            self.email_account.has_auth_error = True
            self.email_account.save(update_fields=['has_auth_error'])
            raise e
        
        return creds
    
    def _get_service(self):
        """Get authenticated Gmail API service."""
        if self.service is None:
            creds = self._get_credentials()
            self.service = build('gmail', 'v1', credentials=creds)
        return self.service
    
    def _get_date_filter(self):
        """Get the date filter for how far back to scan."""
        years_back = settings.GMAIL_SCAN_YEARS_BACK
        cutoff = datetime.now(timezone.utc) - timedelta(days=years_back * 365)
        return f" after:{cutoff.strftime('%Y/%m/%d')}"
    
    def _get_messages(self):
        """Fetch all matching message IDs from Gmail."""
        service = self._get_service()
        query = self.SEARCH_QUERY + self._get_date_filter()
        
        messages = []
        page_token = None
        
        while True:
            result = service.users().messages().list(
                userId='me',
                q=query,
                maxResults=100,
                pageToken=page_token,
            ).execute()
            
            if 'messages' in result:
                messages.extend(result['messages'])
            
            page_token = result.get('nextPageToken')
            if not page_token:
                break
        
        return messages
    
    def _get_message_details(self, message_id):
        """Fetch full details of a single message."""
        service = self._get_service()
        msg = service.users().messages().get(
            userId='me',
            id=message_id,
            format='metadata',
            metadataHeaders=['From', 'Subject', 'Date'],
        ).execute()
        return msg
    
    def _extract_header(self, headers, name):
        """Extract a specific header value from message headers."""
        for header in headers:
            if header['name'].lower() == name.lower():
                return header['value']
        return ''
    
    def scan(self):
        """
        Perform a full scan of the Gmail account.
        Returns a dict with scan results.
        """
        # Create scan log
        scan_log = ScanLog.objects.create(
            email_account=self.email_account,
            status='running',
        )
        
        emails_processed = 0
        registrations_found = 0
        
        try:
            messages = self._get_messages()
            logger.info(f"Found {len(messages)} potential registration emails for {self.email_account.email_address}")
            
            for msg_item in messages:
                try:
                    msg = self._get_message_details(msg_item['id'])
                    headers = msg.get('payload', {}).get('headers', [])
                    
                    from_header = self._extract_header(headers, 'From')
                    subject = self._extract_header(headers, 'Subject')
                    date_str = self._extract_header(headers, 'Date')
                    
                    emails_processed += 1
                    
                    # Detect if this is a registration email
                    detection = self.detector.detect(
                        from_header=from_header,
                        subject=subject,
                        message_id=msg_item['id'],
                    )
                    
                    if detection and detection['confidence'] >= 0.5:
                        # Parse the date
                        registered_at = self._parse_email_date(date_str)
                        
                        # Create or skip registration
                        _, created = SiteRegistration.objects.get_or_create(
                            email_account=self.email_account,
                            site_domain=detection['domain'],
                            defaults={
                                'site_name': detection['site_name'],
                                'site_favicon': f"https://www.google.com/s2/favicons?domain={detection['domain']}&sz=64",
                                'registered_at': registered_at or tz.now(),
                                'email_subject': subject,
                                'email_from': from_header,
                                'gmail_message_id': msg_item['id'],
                                'confidence': detection['confidence'],
                            }
                        )
                        
                        if created:
                            registrations_found += 1
                
                except Exception as e:
                    logger.warning(f"Error processing message {msg_item['id']}: {e}")
                    continue
            
            # Update scan log
            scan_log.status = 'completed'
            scan_log.emails_processed = emails_processed
            scan_log.registrations_found = registrations_found
            scan_log.completed_at = tz.now()
            scan_log.save()
            
            # Update email account
            self.email_account.last_scanned_at = tz.now()
            self.email_account.total_registrations = SiteRegistration.objects.filter(
                email_account=self.email_account, is_dismissed=False
            ).count()
            self.email_account.save(update_fields=['last_scanned_at', 'total_registrations'])
            
            return {
                'emails_processed': emails_processed,
                'registrations_found': registrations_found,
                'status': 'completed',
            }
            
        except Exception as e:
            from google.auth.exceptions import RefreshError
            from googleapiclient.errors import HttpError
            
            is_auth_error = False
            if isinstance(e, RefreshError):
                is_auth_error = True
            elif isinstance(e, HttpError) and e.resp.status in [401, 403]:
                is_auth_error = True
                
            if is_auth_error:
                self.email_account.has_auth_error = True
                self.email_account.save(update_fields=['has_auth_error'])
                
            logger.error(f"Scan failed for {self.email_account.email_address}: {e}")
            scan_log.status = 'failed'
            scan_log.error_message = str(e)
            scan_log.completed_at = tz.now()
            scan_log.save()
            raise
    
    def _parse_email_date(self, date_str):
        """Parse email date string to datetime."""
        if not date_str:
            return None
        
        # Common email date formats
        formats = [
            '%a, %d %b %Y %H:%M:%S %z',
            '%d %b %Y %H:%M:%S %z',
            '%a, %d %b %Y %H:%M:%S %Z',
        ]
        
        # Clean up the date string
        date_str = re.sub(r'\s*\(.*\)\s*$', '', date_str).strip()
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        return None
