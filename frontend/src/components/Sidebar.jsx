import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  DoorOpen,
  CalendarPlus,
  CalendarCheck,
  Tv,
  Clock,
  Shield,
  Wrench,
  Building2,
} from 'lucide-react';

const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { user } = useAuth();
  const role = user?.role || 'employee';

  return (
    <aside
      className={`sidebar ${isMobileOpen ? 'sidebar-mobile-open' : ''}`}
      style={isMobileOpen ? { transform: 'translateX(0)' } : undefined}
    >
      <div className="sidebar-header">
        <div className="logo-icon-box">
          <Building2 size={24} />
        </div>
        <div className="logo-title-group">
          <h2>SmartRoom</h2>
          <span>Resource Sharing</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* Employee Section */}
        {role === 'employee' && (
          <>
            <div className="nav-section-title">Workspace</div>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/rooms"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <DoorOpen size={18} />
              <span>Meeting Rooms</span>
            </NavLink>

            <NavLink
              to="/book"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <CalendarPlus size={18} />
              <span>Book a Room</span>
            </NavLink>

            <NavLink
              to="/my-bookings"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <CalendarCheck size={18} />
              <span>My Bookings</span>
            </NavLink>

            <NavLink
              to="/resources"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <Tv size={18} />
              <span>Shared Resources</span>
            </NavLink>

            <NavLink
              to="/waiting-list"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <Clock size={18} />
              <span>Waiting List</span>
            </NavLink>
          </>
        )}

        {/* Facility Manager Section */}
        {role === 'facility_manager' && (
          <>
            <div className="nav-section-title">Facility Console</div>
            <NavLink
              to="/facility"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <Wrench size={18} />
              <span>Facility Overview</span>
            </NavLink>

            <NavLink
              to="/resources"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <Tv size={18} />
              <span>Equipment & Maintenance</span>
            </NavLink>

            <NavLink
              to="/my-bookings"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <CalendarCheck size={18} />
              <span>All Company Bookings</span>
            </NavLink>

            <NavLink
              to="/rooms"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <DoorOpen size={18} />
              <span>Rooms Directory</span>
            </NavLink>

            <NavLink
              to="/book"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <CalendarPlus size={18} />
              <span>Book Room</span>
            </NavLink>
          </>
        )}

        {/* Admin Section */}
        {role === 'admin' && (
          <>
            <div className="nav-section-title">Administration</div>
            <NavLink
              to="/admin"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <Shield size={18} />
              <span>Admin Management</span>
            </NavLink>

            <NavLink
              to="/rooms"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <DoorOpen size={18} />
              <span>Rooms & Capacity</span>
            </NavLink>

            <NavLink
              to="/resources"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <Tv size={18} />
              <span>Resources & Devices</span>
            </NavLink>

            <NavLink
              to="/my-bookings"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <CalendarCheck size={18} />
              <span>All Bookings</span>
            </NavLink>

            <NavLink
              to="/waiting-list"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <Clock size={18} />
              <span>Waiting List Queue</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.78rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }}></div>
          <span>MongoDB Atlas Connected</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
