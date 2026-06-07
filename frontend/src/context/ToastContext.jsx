import { createContext, useContext, useState, useCallback } from 'react';
import { HiOutlineCheck, HiOutlineExclamation, HiOutlineInformationCircle, HiX } from 'react-icons/hi';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }) {
  const configs = {
    success: { icon: HiOutlineCheck, color: 'text-brand-green', border: 'border-brand-green/30', bar: 'bg-brand-green' },
    error: { icon: HiOutlineExclamation, color: 'text-brand-red', border: 'border-brand-red/30', bar: 'bg-brand-red' },
    warning: { icon: HiOutlineExclamation, color: 'text-brand-yellow', border: 'border-brand-yellow/30', bar: 'bg-brand-yellow' },
    info: { icon: HiOutlineInformationCircle, color: 'text-brand-blue', border: 'border-brand-blue/30', bar: 'bg-brand-blue' },
  };

  const cfg = configs[toast.type] || configs.info;
  const Icon = cfg.icon;

  return (
    <div className={`relative overflow-hidden bg-dark-card/90 backdrop-blur-md border border-dark-border/80 ${cfg.border} rounded-xl p-4 shadow-xl flex items-start gap-3 animate-slide-up`}>
      <Icon className={`w-5 h-5 shrink-0 ${cfg.color} mt-0.5`} />
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium text-text-primary">{toast.message}</p>
      </div>
      <button onClick={onClose} className="text-text-muted hover:text-text-primary shrink-0 transition-colors">
        <HiX className="w-4 h-4" />
      </button>
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-dark-border">
        <div 
          className={`h-full ${cfg.bar}`} 
          style={{ 
            animation: `shrinkWidth ${toast.duration}ms linear forwards` 
          }}
        />
      </div>
    </div>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
