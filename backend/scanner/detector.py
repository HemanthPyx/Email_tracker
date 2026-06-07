"""
Registration email detector — analyzes email metadata to determine
if an email is a registration/welcome email and extracts site info.
"""
import re
from urllib.parse import urlparse


class RegistrationDetector:
    """Detects registration emails and extracts site information."""
    
    # Keywords that strongly indicate a registration email
    STRONG_KEYWORDS = [
        'welcome to', 'thanks for signing up', 'thanks for registering',
        'verify your email', 'confirm your account', 'account created',
        'registration complete', 'successfully registered', 'activate your account',
        'confirm your registration', 'welcome aboard', 'you\'re in',
        'thanks for joining', 'confirm your email address',
    ]
    
    # Keywords that weakly indicate registration
    WEAK_KEYWORDS = [
        'get started', 'new account', 'registration', 'sign up',
        'getting started', 'first steps',
    ]
    
    # Sender patterns typical of automated/registration emails
    NOREPLY_PATTERNS = [
        r'noreply@', r'no-reply@', r'donotreply@', r'do-not-reply@',
        r'notifications@', r'hello@', r'welcome@', r'support@',
        r'info@', r'team@', r'accounts@', r'signup@',
    ]
    
    # Domains to exclude (newsletters, marketing, etc.)
    EXCLUDED_DOMAINS = {
        'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com',
        'yahoo.com', 'aol.com', 'protonmail.com', 'icloud.com',
        'mail.com', 'zoho.com', 'yandex.com',
    }
    
    # Common site name cleanups
    SITE_NAME_CLEANUPS = {
        'noreply': '', 'no-reply': '', 'donotreply': '',
        'notifications': '', 'hello': '', 'welcome': '',
        'support': '', 'info': '', 'team': '', 'accounts': '',
    }
    
    def detect(self, from_header: str, subject: str, message_id: str = '') -> dict | None:
        """
        Analyze an email to detect if it's a registration email.
        
        Returns a dict with detection info or None if not detected.
        """
        # Extract sender email and name
        sender_email, sender_name = self._parse_from_header(from_header)
        
        if not sender_email:
            return None
        
        # Extract domain
        domain = self._extract_domain(sender_email)
        
        if not domain or domain in self.EXCLUDED_DOMAINS:
            return None
        
        # Calculate confidence score
        confidence = 0.0
        
        # Signal 1: Subject line keyword match
        subject_lower = subject.lower()
        
        strong_match = any(kw in subject_lower for kw in self.STRONG_KEYWORDS)
        weak_match = any(kw in subject_lower for kw in self.WEAK_KEYWORDS)
        
        if strong_match:
            confidence += 0.40
        elif weak_match:
            confidence += 0.20
        
        # Signal 2: Sender is a noreply/automated address
        is_noreply = any(
            re.search(pattern, sender_email.lower())
            for pattern in self.NOREPLY_PATTERNS
        )
        if is_noreply:
            confidence += 0.15
        
        # Signal 3: Subject contains a site/brand name
        has_brand_in_subject = self._subject_has_brand(subject, domain)
        if has_brand_in_subject:
            confidence += 0.15
        
        # Signal 4: Subject structure matches typical patterns
        if self._matches_welcome_pattern(subject):
            confidence += 0.15
        
        # Only return if confidence meets threshold
        if confidence < 0.3:
            return None
        
        # Extract site name
        site_name = self._extract_site_name(sender_name, domain, subject)
        
        return {
            'domain': domain,
            'site_name': site_name,
            'confidence': min(confidence, 1.0),
            'sender_email': sender_email,
        }
    
    def _parse_from_header(self, from_header: str) -> tuple:
        """Parse 'From' header into (email, name) tuple."""
        if not from_header:
            return ('', '')
        
        # Format: "Name" <email@domain.com> or email@domain.com
        match = re.match(r'"?([^"<]*)"?\s*<?([^>]+@[^>]+)>?', from_header)
        if match:
            name = match.group(1).strip().strip('"')
            email = match.group(2).strip()
            return (email, name)
        
        # Try just email
        email_match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', from_header)
        if email_match:
            return (email_match.group(), '')
        
        return ('', '')
    
    def _extract_domain(self, email: str) -> str:
        """Extract the domain from an email address."""
        if '@' not in email:
            return ''
        
        domain = email.split('@')[1].lower().strip()
        
        # Remove common subdomains
        parts = domain.split('.')
        if len(parts) > 2 and parts[0] in ('mail', 'email', 'e', 'msg', 'notifications'):
            domain = '.'.join(parts[1:])
        
        return domain
    
    def _extract_site_name(self, sender_name: str, domain: str, subject: str) -> str:
        """Extract a clean site/brand name."""
        # Try sender name first
        if sender_name:
            # Clean up common prefixes
            clean_name = sender_name.strip()
            for cleanup in self.SITE_NAME_CLEANUPS:
                clean_name = re.sub(rf'\b{cleanup}\b', '', clean_name, flags=re.IGNORECASE).strip()
            
            if clean_name and len(clean_name) > 1:
                return clean_name
        
        # Try extracting from subject (e.g., "Welcome to Netflix!")
        welcome_match = re.search(
            r'(?:welcome to|thanks for (?:signing up|joining|registering) (?:with |on |at |to )?)'
            r'["\']?([A-Z][A-Za-z0-9\s.]+)',
            subject,
            re.IGNORECASE
        )
        if welcome_match:
            name = welcome_match.group(1).strip().rstrip('!')
            if len(name) > 1 and len(name) < 50:
                return name
        
        # Fallback to domain name
        name_from_domain = domain.split('.')[0]
        return name_from_domain.capitalize()
    
    def _subject_has_brand(self, subject: str, domain: str) -> bool:
        """Check if subject contains the brand/domain name."""
        domain_name = domain.split('.')[0].lower()
        return domain_name in subject.lower()
    
    def _matches_welcome_pattern(self, subject: str) -> bool:
        """Check if subject matches common welcome email patterns."""
        patterns = [
            r'^welcome\b',
            r'^verify\b',
            r'^confirm\b',
            r'^activate\b',
            r'email\s+(?:verification|confirmation)',
            r'account\s+(?:activation|confirmation|verification)',
        ]
        subject_lower = subject.lower().strip()
        return any(re.search(p, subject_lower) for p in patterns)
