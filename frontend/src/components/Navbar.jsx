import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineViewGrid, HiOutlineSearch, HiOutlineMail, HiOutlineClock, HiOutlineLogout } from 'react-icons/hi';

const navItems = [
  { to: '/', label: 'Dashboard', icon: HiOutlineViewGrid },
  { to: '/search', label: 'Search', icon: HiOutlineSearch },
  { to: '/accounts', label: 'Accounts', icon: HiOutlineMail },
  { to: '/scans', label: 'Scan History', icon: HiOutlineClock },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    setShowConfirm(false);
    navigate('/login');
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-dark-surface/80 backdrop-blur-xl border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-blue/20 flex items-center justify-center">
              <HiOutlineMail className="w-5 h-5 text-brand-blue" />
            </div>
            <span className="text-lg font-bold text-text-primary tracking-tight">
              Mail<span className="text-brand-blue">Tracker</span>
            </span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-blue/15 text-brand-blue'
                      : 'text-text-secondary hover:text-text-primary hover:bg-dark-hover'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.first_name}
                className="w-8 h-8 rounded-full border-2 border-dark-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-blue/20 flex items-center justify-center">
                <span className="text-sm font-semibold text-brand-blue">
                  {user?.first_name?.[0] || user?.email?.[0] || '?'}
                </span>
              </div>
            )}
            <button
              onClick={() => setShowConfirm(true)}
              className="btn-ghost !p-2 text-text-muted hover:text-brand-red"
              title="Logout"
            >
              <HiOutlineLogout className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-blue/15 text-brand-blue'
                    : 'text-text-secondary hover:text-text-primary'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>

    {/* Logout Confirmation Modal */}
    {showConfirm && (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-fade-in">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-dark-bg/60 backdrop-blur-sm"
          onClick={() => setShowConfirm(false)}
        />
        
        {/* Modal Content */}
        <div className="relative w-full max-w-sm overflow-hidden bg-dark-card/95 backdrop-blur-md border border-dark-border/80 rounded-2xl p-6 shadow-2xl animate-scale-in">
          <div className="flex flex-col items-center text-center">
            {/* Warning Icon container */}
            <div className="w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center mb-4 animate-pulse-soft">
              <HiOutlineLogout className="w-6 h-6 text-brand-red" />
            </div>
            
            <h3 className="text-lg font-bold text-text-primary mb-2">
              Confirm Logout
            </h3>
            
            <p className="text-sm text-text-muted mb-6">
              Are you sure you want to log out of your session?
            </p>
            
            {/* Buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-dark-hover text-text-secondary hover:text-text-primary rounded-xl text-sm font-semibold border border-dark-border/60 transition-all hover:bg-dark-hover/80 active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 bg-brand-red text-dark-bg hover:bg-brand-red/90 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              >
                Yes, Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
