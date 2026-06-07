/**
 * Accounts page — manage connected email accounts.
 */
import { useState, useEffect } from 'react';
import { emailAccountAPI, authAPI, scanAPI } from '../services/api';
import AccountCard from '../components/AccountCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { HiOutlineMail, HiOutlinePlus } from 'react-icons/hi';
import { useToast } from '../context/ToastContext';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanningId, setScanningId] = useState(null);
  const { addToast } = useToast();

  const fetchAccounts = async () => {
    try {
      const res = await emailAccountAPI.list();
      setAccounts(res.data.results || res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleConnect = async () => {
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const res = await authAPI.getGoogleAuthUrl(redirectUri);
      if (res.data.code_verifier) {
        sessionStorage.setItem('code_verifier', res.data.code_verifier);
      }
      window.location.href = res.data.auth_url;
    } catch (err) {
      console.error(err);
      addToast('Failed to start authentication flow.', 'error');
    }
  };

  const handleScan = async (accountId) => {
    setScanningId(accountId);
    addToast('Starting email scan...', 'info');
    try {
      const res = await scanAPI.trigger(accountId);
      const result = res.data?.results?.[0];
      if (result && result.status === 'completed') {
        addToast(
          `Scan completed! Found ${result.registrations_found} registration(s) from ${result.emails_processed} emails.`,
          'success'
        );
      } else if (result && result.status === 'failed') {
        addToast(`Scan failed: ${result.error || 'Authentication error'}`, 'error');
      } else {
        addToast('Scan completed.', 'success');
      }
      await fetchAccounts();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Scan failed. Please check your connection.', 'error');
    } finally {
      setScanningId(null);
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await emailAccountAPI.update(id, data);
      addToast('Account settings updated.', 'success');
      await fetchAccounts();
    } catch (err) {
      console.error(err);
      addToast('Failed to update account settings.', 'error');
    }
  };

  const handleDisconnect = async (id) => {
    if (!window.confirm('Disconnect this email account? Registration data will be preserved.')) return;
    try {
      await emailAccountAPI.disconnect(id);
      addToast('Email account disconnected.', 'success');
      await fetchAccounts();
    } catch (err) {
      console.error(err);
      addToast('Failed to disconnect email account.', 'error');
    }
  };

  if (loading) return <Loader text="Loading accounts..." />;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Email Accounts</h1>
          <p className="text-sm text-text-secondary">Manage your connected Gmail accounts</p>
        </div>
        <button onClick={handleConnect} className="btn-primary">
          <HiOutlinePlus className="w-4 h-4" /> Connect Gmail
        </button>
      </div>

      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map(acc => (
            <AccountCard key={acc.id} account={acc} onScan={handleScan} onUpdate={handleUpdate}
              onDisconnect={handleDisconnect} onReconnect={handleConnect} scanning={scanningId === acc.id} />
          ))}
        </div>
      ) : (
        <EmptyState icon={HiOutlineMail} title="No accounts connected"
          description="Connect your Gmail accounts to start tracking registrations."
          action={<button onClick={handleConnect} className="btn-primary"><HiOutlinePlus className="w-4 h-4" /> Connect Gmail</button>} />
      )}
    </div>
  );
}
