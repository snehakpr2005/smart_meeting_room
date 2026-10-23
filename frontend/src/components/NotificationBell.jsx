import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCircle, Clock, AlertTriangle, Info } from 'lucide-react';
import { waitingListApi, bookingApi } from '../api/axiosClient';

/* ── A single notification item ──────────────────────────────── */
const NotifItem = ({ notif, onDismiss, onNavigate }) => {
  const icons = {
    assigned: <CheckCircle size={16} color="#059669" />,
    conflict: <AlertTriangle size={16} color="#d97706" />,
    checkin: <Clock size={16} color="#2563eb" />,
    info: <Info size={16} color="#6366f1" />,
  };
  return (
    <div style={{
      display: 'flex', gap: '0.75rem', padding: '0.75rem 1rem',
      borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
      background: notif.read ? '#fff' : '#eff6ff',
      transition: 'background 0.15s',
    }}
      onClick={() => onNavigate(notif)}
    >
      <div style={{ flexShrink: 0, marginTop: 2 }}>{icons[notif.type] || icons.info}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f172a', marginBottom: '0.15rem' }}>
          {notif.title}
        </div>
        <div style={{ fontSize: '0.77rem', color: '#64748b', lineHeight: 1.4 }}>{notif.message}</div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>{notif.timeLabel}</div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDismiss(notif.id); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8', flexShrink: 0 }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

/* ── Notification Bell ────────────────────────────────────────── */
const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropRef = useRef(null);
  const lastCheckedRef = useRef(Date.now());

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Poll for changes every 30s */
  const checkForUpdates = useCallback(async () => {
    try {
      const [waitingRes, bookingsRes] = await Promise.all([
        waitingListApi.getWaitingList(),
        bookingApi.getAllBookings(),
      ]);
      const queue = waitingRes || [];
      const bookingsList = bookingsRes || [];
      const newNotifs = [];

      // Waiting list → assigned recently
      queue.forEach(item => {
        if (item.status === 'assigned' && new Date(item.updatedAt) > new Date(lastCheckedRef.current - 5 * 60 * 1000)) {
          newNotifs.push({
            id: `assigned-${item._id}`,
            type: 'assigned',
            title: '🎉 Waiting List Auto-Assigned!',
            message: `You've been assigned ${item.roomId?.name || 'a room'} on ${new Date(item.date).toLocaleDateString()} (${item.startTime}–${item.endTime}).`,
            timeLabel: 'Just now',
            route: '/my-bookings',
            read: false,
          });
        }
      });

      // Upcoming meetings in next 30 min
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      bookingsList.forEach(b => {
        if (b.status !== 'confirmed' || b.checkedIn) return;
        const bDate = b.date ? new Date(b.date).toISOString().split('T')[0] : '';
        if (bDate !== todayStr) return;
        const [h, m] = (b.startTime || '00:00').split(':').map(Number);
        const startMs = new Date().setHours(h, m, 0, 0);
        const diff = (startMs - now) / 60000;
        if (diff > 0 && diff <= 30) {
          newNotifs.push({
            id: `checkin-${b._id}`,
            type: 'checkin',
            title: '⏰ Meeting Starting Soon',
            message: `${b.roomId?.name || 'Your meeting'} starts at ${b.startTime}. Don't forget to check in!`,
            timeLabel: `In ${Math.round(diff)} min`,
            route: '/my-bookings',
            read: false,
          });
        }
      });

      if (newNotifs.length > 0) {
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const fresh = newNotifs.filter(n => !existingIds.has(n.id));
          return [...fresh, ...prev].slice(0, 20);
        });
      }
      lastCheckedRef.current = Date.now();
    } catch {
      // silently ignore polling errors
    }
  }, []);

  useEffect(() => {
    checkForUpdates();
    const interval = setInterval(checkForUpdates, 30000);
    return () => clearInterval(interval);
  }, [checkForUpdates]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleDismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNavigate = (notif) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setOpen(false);
    if (notif.route) navigate(notif.route);
  };

  const clearAll = () => setNotifications([]);
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(o => !o); markAllRead(); }}
        style={{
          position: 'relative', background: 'none', border: '1px solid #e2e8f0',
          borderRadius: 8, padding: '0.4rem 0.6rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', color: '#475569',
          transition: 'all 0.15s',
        }}
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: '#ef4444', color: '#fff', borderRadius: '50%',
            width: 18, height: 18, fontSize: '0.65rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 340, maxHeight: 420, overflowY: 'auto',
          background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          border: '1px solid #e2e8f0', zIndex: 9999,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.85rem 1rem', borderBottom: '1px solid #f1f5f9',
            position: 'sticky', top: 0, background: '#fff', zIndex: 1,
          }}>
            <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>
              Notifications {notifications.length > 0 && `(${notifications.length})`}
            </strong>
            {notifications.length > 0 && (
              <button onClick={clearAll} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.75rem', color: '#64748b',
              }}>Clear all</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              <Bell size={28} style={{ margin: '0 auto 0.5rem', display: 'block', opacity: 0.3 }} />
              No notifications yet
            </div>
          ) : (
            notifications.map(n => (
              <NotifItem key={n.id} notif={n} onDismiss={handleDismiss} onNavigate={handleNavigate} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
