import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Menu } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="badge badge-role-admin">Admin</span>;
      case 'facility_manager':
        return <span className="badge badge-role-manager">Facility Manager</span>;
      default:
        return <span className="badge badge-role-employee">Employee</span>;
    }
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button
          className="btn btn-secondary btn-sm"
          style={{ display: 'none', padding: '0.4rem' }}
          onClick={onToggleSidebar}
          id="mobile-sidebar-toggle"
        >
          <Menu size={18} />
        </button>

        {/* Backend Cron Scheduler Status */}
        <div className="cron-badge" title="Backend scheduler automatically marks completed meetings and cancels no-shows after 15 min">
          <span className="cron-pulse-dot"></span>
          <span>15-Min Auto-Cancellation Cron Active</span>
        </div>
      </div>

      <div className="navbar-right">
        {/* Notification Bell */}
        <NotificationBell />

        {/* User profile card */}
        <div className="user-profile-widget">
          <div className="user-avatar">
            {user?.email ? user.email.charAt(0).toUpperCase() : <User size={18} />}
          </div>
          <div className="user-meta">
            <span className="user-email-text">{user?.email || 'User'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
              {getRoleBadge(user?.role)}
              <span className="user-dept-text">• {user?.department || 'General'}</span>
            </div>
          </div>
        </div>

        {/* Logout action */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={logout}
          title="Sign out of system"
          style={{ gap: '0.4rem', borderColor: '#e2e8f0' }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
