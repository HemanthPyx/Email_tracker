/**
 * Search page — search and filter site registrations.
 */
import { useState, useEffect, useCallback } from 'react';
import { registrationAPI, emailAccountAPI } from '../services/api';
import SearchBar from '../components/SearchBar';
import SiteCard from '../components/SiteCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { HiOutlineSearch, HiOutlineFilter, HiOutlineX } from 'react-icons/hi';

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'personal', label: 'Personal' },
  { value: 'work', label: 'Work' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'social', label: 'Social' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    emailAccountAPI.list().then(res => setAccounts(res.data.results || res.data || [])).catch(console.error);
  }, []);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (query) params.search = query;
      if (selectedAccount) params.email_account = selectedAccount;
      if (selectedCategory) params.category = selectedCategory;
      const res = await registrationAPI.list(params);
      const data = res.data.results || res.data || [];
      setRegistrations(data);
      setTotalCount(res.data.count || data.length);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setInitialLoad(false); }
  }, [query, selectedAccount, selectedCategory]);

  useEffect(() => {
    const t = setTimeout(fetchRegistrations, 300);
    return () => clearTimeout(t);
  }, [fetchRegistrations]);

  const handleVerify = async (id) => {
    await registrationAPI.verify(id);
    setRegistrations(p => p.map(r => r.id === id ? { ...r, is_verified: true } : r));
  };

  const handleDismiss = async (id) => {
    await registrationAPI.dismiss(id);
    setRegistrations(p => p.filter(r => r.id !== id));
  };

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Search Registrations</h1>
        <p className="text-sm text-text-secondary">Find which email you used for any website</p>
      </div>

      <div className="mb-4">
        <SearchBar value={query} onChange={setQuery} size="large" autoFocus />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary text-xs ${showFilters ? 'border-brand-blue/30 text-brand-blue' : ''}`}>
          <HiOutlineFilter className="w-3.5 h-3.5" /> Filters
        </button>
        {(selectedAccount || selectedCategory) && (
          <button onClick={() => { setSelectedAccount(''); setSelectedCategory(''); }} className="btn-ghost text-xs text-brand-red">
            <HiOutlineX className="w-3.5 h-3.5" /> Clear
          </button>
        )}
        <span className="text-xs text-text-muted ml-auto">{totalCount} found</span>
      </div>

      {showFilters && (
        <div className="card mb-6 animate-slide-down">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Account</label>
              <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="input">
                <option value="">All Accounts</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.email_address}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Category</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="input">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {loading && initialLoad ? <Loader text="Searching..." /> : registrations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {registrations.map(r => <SiteCard key={r.id} registration={r} onVerify={handleVerify} onDismiss={handleDismiss} />)}
        </div>
      ) : (
        <EmptyState icon={HiOutlineSearch} title={query ? 'No results found' : 'No registrations yet'}
          description={query ? `No registrations match "${query}".` : 'Run a scan to detect registrations.'} />
      )}
    </div>
  );
}
