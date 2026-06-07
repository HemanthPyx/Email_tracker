/**
 * Email account card component.
 */
import { useState } from 'react';
import { HiOutlineRefresh, HiOutlinePencil, HiOutlineTrash, HiOutlineCheck } from 'react-icons/hi';

const categoryColors = {
  personal: 'border-brand-blue/30',
  work: 'border-brand-green/30',
  gaming: 'border-purple-500/30',
  shopping: 'border-brand-yellow/30',
  social: 'border-pink-500/30',
  finance: 'border-emerald-500/30',
  education: 'border-cyan-500/30',
  other: 'border-gray-500/30',
};

const categoryIcons = {
  personal: '👤',
  work: '💼',
  gaming: '🎮',
  shopping: '🛒',
  social: '💬',
  finance: '💰',
  education: '📚',
  other: '📧',
};

const categories = [
  { value: 'personal', label: 'Personal' },
  { value: 'work', label: 'Work' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'social', label: 'Social Media' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
];

export default function AccountCard({ account, onScan, onUpdate, onDisconnect, onReconnect, scanning = false }) {
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState(account.category);
  const [displayName, setDisplayName] = useState(account.display_name);

  const handleSave = () => {
    onUpdate(account.id, { category, display_name: displayName });
    setEditing(false);
  };

  return (
    <div className={`card-hover border-l-4 ${
      account.has_auth_error 
        ? 'border-brand-red animate-pulse-soft' 
        : (categoryColors[account.category] || categoryColors.other)
    } animate-slide-up`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{categoryIcons[account.category] || '📧'}</span>
          <div>
            {editing ? (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input !py-1 !px-2 !text-sm mb-1"
                placeholder="Display name"
              />
            ) : (
              <h3 className="text-sm font-semibold text-text-primary">
                {account.display_name || account.email_address}
              </h3>
            )}
            <p className="text-xs text-text-muted font-mono">{account.email_address}</p>
            {account.has_auth_error && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-full mt-1.5 animate-pulse">
                ⚠️ Connection Lost
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {editing ? (
            <button onClick={handleSave} className="p-1.5 rounded-md hover:bg-brand-green/10 text-brand-green transition-all">
              <HiOutlineCheck className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-md hover:bg-dark-hover text-text-muted hover:text-text-primary transition-all">
              <HiOutlinePencil className="w-4 h-4" />
            </button>
          )}
          {account.has_auth_error ? (
            <button
              onClick={onReconnect}
              className="p-1.5 rounded-md bg-brand-red/15 hover:bg-brand-red/25 text-brand-red transition-all text-xs font-semibold px-2 flex items-center gap-1"
              title="Reconnect Account"
            >
              Reconnect
            </button>
          ) : (
            <button
              onClick={() => onScan(account.id)}
              disabled={scanning}
              className="p-1.5 rounded-md hover:bg-brand-blue/10 text-text-muted hover:text-brand-blue transition-all disabled:opacity-50"
              title="Scan now"
            >
              <HiOutlineRefresh className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={() => onDisconnect(account.id)}
            className="p-1.5 rounded-md hover:bg-brand-red/10 text-text-muted hover:text-brand-red transition-all"
            title="Disconnect"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {editing && (
        <div className="mb-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input !py-1.5 !text-sm"
          >
            {categories.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-text-muted pt-3 border-t border-dark-border">
        <span>
          <span className="text-brand-green font-semibold">{account.total_registrations}</span> registrations found
        </span>
        <span>
          {account.last_scanned_at 
            ? `Last scan: ${new Date(account.last_scanned_at).toLocaleDateString()}`
            : 'Never scanned'
          }
        </span>
      </div>
    </div>
  );
}
