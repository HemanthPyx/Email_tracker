/**
 * Site registration card component.
 */
import { HiOutlineExternalLink, HiOutlineClipboardCopy, HiOutlineCheck, HiOutlineShieldCheck, HiOutlineX } from 'react-icons/hi';
import { useState } from 'react';

const categoryColors = {
  personal: 'bg-brand-blue/15 text-brand-blue',
  work: 'bg-brand-green/15 text-brand-green',
  gaming: 'bg-purple-500/15 text-purple-400',
  shopping: 'bg-brand-yellow/15 text-yellow-500',
  social: 'bg-pink-500/15 text-pink-400',
  finance: 'bg-emerald-500/15 text-emerald-400',
  education: 'bg-cyan-500/15 text-cyan-400',
  other: 'bg-gray-500/15 text-gray-400',
};

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function SiteCard({ registration, onVerify, onDismiss }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(registration.email_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidenceColor = registration.confidence >= 0.8 
    ? 'text-brand-green' 
    : registration.confidence >= 0.5 
      ? 'text-brand-yellow' 
      : 'text-brand-red';

  return (
    <div className="card-hover group animate-fade-in">
      <div className="flex items-start gap-4">
        {/* Favicon */}
        <div className="w-10 h-10 rounded-lg bg-dark-surface border border-dark-border flex items-center justify-center overflow-hidden flex-shrink-0">
          {registration.site_favicon ? (
            <img
              src={registration.site_favicon}
              alt={registration.site_name}
              className="w-6 h-6"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <span 
            className="text-sm font-bold text-brand-blue"
            style={{ display: registration.site_favicon ? 'none' : 'flex' }}
          >
            {registration.site_name?.[0]?.toUpperCase() || '?'}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {registration.site_name}
            </h3>
            {registration.is_verified && (
              <HiOutlineShieldCheck className="w-4 h-4 text-brand-green flex-shrink-0" title="Verified" />
            )}
          </div>
          
          <p className="text-xs text-text-muted mb-2 truncate">
            {registration.site_domain}
          </p>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge ${categoryColors[registration.email_category] || categoryColors.other}`}>
              {registration.email_category}
            </span>
            <span className="text-xs text-text-muted">
              {timeAgo(registration.registered_at)}
            </span>
            <span className={`text-xs font-mono ${confidenceColor}`}>
              {Math.round(registration.confidence * 100)}%
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-dark-hover text-text-muted hover:text-brand-blue transition-all"
            title="Copy email"
          >
            {copied ? <HiOutlineCheck className="w-4 h-4 text-brand-green" /> : <HiOutlineClipboardCopy className="w-4 h-4" />}
          </button>
          <a
            href={`https://${registration.site_domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md hover:bg-dark-hover text-text-muted hover:text-brand-blue transition-all"
            title="Visit site"
          >
            <HiOutlineExternalLink className="w-4 h-4" />
          </a>
          {onVerify && !registration.is_verified && (
            <button
              onClick={() => onVerify(registration.id)}
              className="p-1.5 rounded-md hover:bg-brand-green/10 text-text-muted hover:text-brand-green transition-all"
              title="Verify"
            >
              <HiOutlineShieldCheck className="w-4 h-4" />
            </button>
          )}
          {onDismiss && (
            <button
              onClick={() => onDismiss(registration.id)}
              className="p-1.5 rounded-md hover:bg-brand-red/10 text-text-muted hover:text-brand-red transition-all"
              title="Dismiss"
            >
              <HiOutlineX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Email used */}
      <div className="mt-3 pt-3 border-t border-dark-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Registered with:</span>
            <span className="text-xs font-medium text-brand-blue font-mono">
              {registration.email_address}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
