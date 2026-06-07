/**
 * Scan History page — view past scanning sessions.
 */
import { useState, useEffect } from 'react';
import { scanAPI } from '../services/api';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { HiOutlineClock, HiOutlineCheck, HiOutlineExclamation, HiOutlineRefresh } from 'react-icons/hi';

const statusConfig = {
  completed: { icon: HiOutlineCheck, color: 'text-brand-green', bg: 'bg-brand-green/10', label: 'Completed' },
  running: { icon: HiOutlineRefresh, color: 'text-brand-blue', bg: 'bg-brand-blue/10', label: 'Running' },
  failed: { icon: HiOutlineExclamation, color: 'text-brand-red', bg: 'bg-brand-red/10', label: 'Failed' },
};

export default function ScanHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scanAPI.logs().then(res => {
      setLogs(res.data.results || res.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading scan history..." />;

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Scan History</h1>
        <p className="text-sm text-text-secondary">View past email scanning sessions</p>
      </div>

      {logs.length > 0 ? (
        <div className="space-y-3">
          {logs.map(log => {
            const cfg = statusConfig[log.status] || statusConfig.completed;
            const StatusIcon = cfg.icon;
            return (
              <div key={log.id} className="card-hover animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                      <StatusIcon className={`w-4 h-4 ${cfg.color} ${log.status === 'running' ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{log.email_address}</p>
                      <p className="text-xs text-text-muted">
                        {new Date(log.started_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-text-secondary">
                        <span className="font-semibold text-text-primary">{log.emails_processed}</span> emails
                      </span>
                      <span className="text-text-secondary">
                        <span className="font-semibold text-brand-green">{log.registrations_found}</span> found
                      </span>
                      <span className={`badge ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    {log.error_message && (
                      <p className="text-xs text-brand-red mt-1 max-w-xs truncate">{log.error_message}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={HiOutlineClock} title="No scans yet"
          description="Scan history will appear here after you run your first email scan." />
      )}
    </div>
  );
}
