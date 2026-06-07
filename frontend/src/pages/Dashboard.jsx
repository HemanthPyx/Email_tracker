/**
 * Dashboard page — overview of all accounts and recent registrations.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, scanAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatsWidget from '../components/StatsWidget';
import SiteCard from '../components/SiteCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { 
  HiOutlineMail, HiOutlineGlobe, HiOutlineClock, HiOutlineRefresh,
  HiOutlineSearch 
} from 'react-icons/hi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useToast } from '../context/ToastContext';

const CHART_COLORS = ['#70A1D7', '#A1DE93', '#F7F48B', '#F47C7C', '#A78BFA', '#F472B6', '#34D399', '#9CA3AF'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const { addToast } = useToast();

  const fetchStats = async () => {
    try {
      const res = await dashboardAPI.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleScanAll = async () => {
    setScanning(true);
    addToast('Starting batch scan for all active accounts...', 'info');
    try {
      const res = await scanAPI.trigger();
      const results = res.data?.results || [];
      const completed = results.filter(r => r.status === 'completed');
      const failed = results.filter(r => r.status === 'failed');
      const totalRegistrations = completed.reduce((sum, r) => sum + r.registrations_found, 0);

      if (failed.length > 0) {
        addToast(
          `Batch scan finished with warnings. Scanned ${completed.length} account(s) (${totalRegistrations} found). ${failed.length} account(s) failed.`,
          'warning'
        );
      } else {
        addToast(
          `Batch scan completed successfully! Found ${totalRegistrations} new registration(s) across ${completed.length} account(s).`,
          'success'
        );
      }
      await fetchStats();
    } catch (err) {
      console.error('Scan failed:', err);
      addToast(err.response?.data?.error || 'Batch scan failed. Please check your connection.', 'error');
    } finally {
      setScanning(false);
    }
  };

  if (loading) return <Loader text="Loading dashboard..." />;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Welcome back, <span className="text-brand-blue">{user?.first_name || 'there'}</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Here&apos;s an overview of your email registrations
          </p>
        </div>
        <button 
          onClick={handleScanAll} 
          disabled={scanning}
          className="btn-primary"
        >
          <HiOutlineRefresh className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Scan All'}
        </button>
      </div>

      {/* Warning Banner */}
      {stats?.accounts_with_errors_count > 0 && (
        <div className="mb-6 p-4 bg-brand-red/10 border border-brand-red/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="text-sm font-semibold text-brand-red">Action Required</h4>
              <p className="text-xs text-text-secondary">
                {stats.accounts_with_errors_count === 1
                  ? "One of your Gmail accounts has disconnected. Reconnect it to resume scanning."
                  : `${stats.accounts_with_errors_count} of your Gmail accounts have disconnected. Reconnect them to resume scanning.`}
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/accounts')}
            className="px-3 py-1.5 bg-brand-red text-dark-bg hover:bg-brand-red/90 rounded-lg text-xs font-semibold transition-all shrink-0 active:scale-[0.98]"
          >
            Fix Now
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsWidget
          icon={HiOutlineMail}
          label="Connected Accounts"
          value={stats?.total_accounts || 0}
          color="blue"
        />
        <StatsWidget
          icon={HiOutlineGlobe}
          label="Sites Detected"
          value={stats?.total_registrations || 0}
          color="green"
        />
        <StatsWidget
          icon={HiOutlineClock}
          label="Last Scan"
          value={stats?.last_scan 
            ? new Date(stats.last_scan.started_at).toLocaleDateString()
            : 'Never'}
          color="yellow"
          subtitle={stats?.last_scan?.status || ''}
        />
        <StatsWidget
          icon={HiOutlineSearch}
          label="Categories"
          value={stats?.registrations_by_category?.length || 0}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Registrations */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title !mb-0">Recent Registrations</h2>
            <button 
              onClick={() => navigate('/search')} 
              className="btn-ghost text-xs"
            >
              View all →
            </button>
          </div>
          
          {stats?.recent_registrations?.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_registrations.map((reg) => (
                <SiteCard key={reg.id} registration={reg} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={HiOutlineGlobe}
              title="No registrations yet"
              description="Connect a Gmail account and run a scan to detect your site registrations."
              action={
                <button onClick={() => navigate('/accounts')} className="btn-primary">
                  Connect Account
                </button>
              }
            />
          )}
        </div>

        {/* Category Breakdown */}
        <div>
          <h2 className="section-title">By Category</h2>
          <div className="card">
            {stats?.registrations_by_category?.length > 0 ? (
              <>
                <div className="h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.registrations_by_category}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={40}
                        strokeWidth={0}
                      >
                        {stats.registrations_by_category.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1A1F2E',
                          border: '1px solid #2A3040',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#E8EAED',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {stats.registrations_by_category.map((item, i) => (
                    <div key={item.category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="text-text-secondary capitalize">{item.category}</span>
                      </div>
                      <span className="font-semibold text-text-primary">{item.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-text-muted text-center py-8">
                No data yet. Run a scan to see categories.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
