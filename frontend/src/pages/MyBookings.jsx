import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../api/axiosClient';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import AlertBanner from '../components/AlertBanner';
import Modal from '../components/Modal';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  Building,
  Calendar,
  AlertTriangle,
  DoorOpen,
} from 'lucide-react';

const MyBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cancellation modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await bookingApi.getAllBookings();
      // Sort newest first
      const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setBookings(sorted);
    } catch (err) {
      setErrorMsg('Failed to load bookings: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCheckIn = async (id) => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      const res = await bookingApi.checkInBooking(id);
      setSuccessMsg(res.data?.message || 'Checked in successfully!');
      await fetchBookings();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to check in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    try {
      setActionLoading(true);
      setErrorMsg('');
      const res = await bookingApi.cancelBooking(bookingToCancel._id);
      setSuccessMsg(res.data?.message || 'Booking cancelled successfully.');
      setCancelModalOpen(false);
      setBookingToCancel(null);
      await fetchBookings();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter.toLowerCase();
  });

  const getStatusBadge = (status, checkedIn) => {
    if (status === 'confirmed') {
      if (checkedIn) {
        return (
          <span className="badge badge-checked-in">
            <CheckCircle2 size={12} />
            Confirmed (Checked In)
          </span>
        );
      }
      return (
        <span className="badge badge-confirmed">
          <span className="badge-dot"></span>
          Confirmed (Pending Check-In)
        </span>
      );
    }
    if (status === 'completed') {
      return (
        <span className="badge badge-completed">
          <span className="badge-dot"></span>
          Completed
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className="badge badge-cancelled">
          <span className="badge-dot"></span>
          Cancelled
        </span>
      );
    }
    return <span className="badge">{status}</span>;
  };

  const isElevatedRole = user?.role === 'admin' || user?.role === 'facility_manager';

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h1>{isElevatedRole ? 'Company Meeting Reservations' : 'My Meeting Bookings'}</h1>
          <p>
            {isElevatedRole
              ? 'Oversee all room bookings across departments, verify attendance, and monitor schedules.'
              : 'Review your upcoming and past room reservations, check in for meetings, or release slots.'}
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={fetchBookings} disabled={loading}>
            <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/book')}>
            <span>Book New Room</span>
          </button>
        </div>
      </div>

      {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Filter Tabs */}
      <div className="tabs-container">
        {['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${statusFilter === tab ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab)}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
            <span
              style={{
                fontSize: '0.75rem',
                backgroundColor: statusFilter === tab ? 'var(--primary-100)' : '#e2e8f0',
                color: statusFilter === tab ? 'var(--primary-800)' : '#64748b',
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                fontWeight: 700,
              }}
            >
              {tab === 'ALL'
                ? bookings.length
                : bookings.filter((b) => b.status === tab.toLowerCase()).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading reservation history from database..." />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No Bookings Found"
          description={
            statusFilter === 'ALL'
              ? 'You have not scheduled any meeting room reservations yet.'
              : `No bookings found with status "${statusFilter.toLowerCase()}".`
          }
          actionLabel="Book a Meeting Room"
          onAction={() => navigate('/book')}
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room Details</th>
                <th>Date</th>
                <th>Time Window</th>
                <th>Allocated Equipment</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => (
                <tr key={b._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <DoorOpen size={18} color="#2563eb" />
                      <div>
                        <strong>{b.roomId?.name || 'Room (Removed)'}</strong>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          Floor {b.roomId?.floor ?? 'N/A'} • Capacity {b.roomId?.capacity ?? 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                      <Calendar size={14} color="#64748b" />
                      <span>{b.date ? new Date(b.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1e40af', fontWeight: 600 }}>
                      <Clock size={14} />
                      <span>
                        {b.startTime} – {b.endTime}
                      </span>
                    </div>
                  </td>
                  <td>
                    {b.resources && b.resources.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxWidth: '240px' }}>
                        {b.resources.map((item, idx) => (
                          <span key={idx} className="badge badge-confirmed">
                            {item.resourceId?.name || 'Device'} #{item.resourceId?.unitNumber || ''} (x{item.quantity})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                        None
                      </span>
                    )}
                  </td>
                  <td>{getStatusBadge(b.status, b.checkedIn)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      {b.status === 'confirmed' && !b.checkedIn && (
                        <button
                          className="btn btn-success btn-sm"
                          disabled={actionLoading}
                          onClick={() => handleCheckIn(b._id)}
                          title="Check in to confirm meeting attendance"
                        >
                          <CheckCircle2 size={14} />
                          <span>Check In</span>
                        </button>
                      )}

                      {b.status === 'confirmed' && (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          disabled={actionLoading}
                          onClick={() => {
                            setBookingToCancel(b);
                            setCancelModalOpen(true);
                          }}
                          title="Cancel this reservation"
                        >
                          <XCircle size={14} />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Meeting Reservation"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setCancelModalOpen(false)}
              disabled={actionLoading}
            >
              Keep Booking
            </button>
            <button
              className="btn btn-danger"
              onClick={handleConfirmCancel}
              disabled={actionLoading}
            >
              {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 style={{ marginBottom: '0.4rem', color: '#0f172a' }}>
              Are you sure you want to cancel this booking?
            </h4>
            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
              Room: <strong>{bookingToCancel?.roomId?.name}</strong> on{' '}
              <strong>
                {bookingToCancel?.date ? new Date(bookingToCancel.date).toLocaleDateString() : ''} (
                {bookingToCancel?.startTime} – {bookingToCancel?.endTime})
              </strong>
              . The room and attached resources will be immediately made available for other team members.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyBookings;
