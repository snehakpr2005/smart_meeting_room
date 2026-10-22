import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roomApi, resourceApi, bookingApi } from '../api/axiosClient';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import {
  Wrench,
  Tv,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  DoorOpen,
  CalendarCheck,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const FacilityDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [resources, setResources] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchFacilityData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [resData, roomData, bookData] = await Promise.all([
        resourceApi.getAllResources(),
        roomApi.getAllRooms(),
        bookingApi.getAllBookings(),
      ]);

      setResources(resData);
      setRooms(roomData);
      setBookings(bookData);
    } catch (err) {
      setErrorMsg('Failed to load facility data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilityData();
  }, []);

  // Toggle equipment status (Backend allows facility_manager on /resource/update/:id)
  const handleToggleResource = async (res) => {
    const nextStatus = res.status === 'available' ? 'broken' : 'available';
    try {
      setActionLoading(true);
      setErrorMsg('');
      await resourceApi.updateResource(res._id, {
        name: res.name,
        unitNumber: res.unitNumber,
        status: nextStatus,
      });

      setSuccessMsg(
        `Equipment "${res.name} #${res.unitNumber}" status set to ${nextStatus.toUpperCase()}.`
      );
      await fetchFacilityData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update equipment');
    } finally {
      setActionLoading(false);
    }
  };

  // Check In booking
  const handleCheckIn = async (bookingId) => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      await bookingApi.checkInBooking(bookingId);
      setSuccessMsg('Meeting room checked in successfully on behalf of participants.');
      await fetchFacilityData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this meeting booking?')) return;
    try {
      setActionLoading(true);
      setErrorMsg('');
      await bookingApi.cancelBooking(bookingId);
      setSuccessMsg('Reservation cancelled.');
      await fetchFacilityData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading facility management logs and device statuses..." />;
  }

  const availableCount = resources.filter((r) => r.status === 'available').length;
  const brokenCount = resources.filter((r) => r.status === 'broken').length;
  const activeBookings = bookings.filter((b) => b.status === 'confirmed');

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Facility Management Console</h1>
          <p>
            Welcome, <strong>{user?.email}</strong>. Maintain room hardware readiness, resolve broken equipment,
            and monitor attendee check-ins.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={fetchFacilityData} disabled={actionLoading}>
            <RotateCw size={16} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* KPI Cards */}
      <div className="stat-card-grid">
        <StatCard
          title="Operational Equipment"
          value={availableCount}
          subtitle="Ready for meetings"
          icon={CheckCircle2}
          colorTheme="green"
        />
        <StatCard
          title="Maintenance Required"
          value={brokenCount}
          subtitle="Out of order units"
          icon={AlertTriangle}
          colorTheme="amber"
        />
        <StatCard
          title="Managed Rooms"
          value={rooms.length}
          subtitle="Under building facility"
          icon={DoorOpen}
          colorTheme="blue"
        />
        <StatCard
          title="Active Reservations"
          value={activeBookings.length}
          subtitle="Company-wide meetings"
          icon={CalendarCheck}
          colorTheme="purple"
        />
      </div>

      {/* Resource Health Maintenance Console */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h2 className="card-title">
            <Wrench size={20} color="#2563eb" />
            <span>Hardware Health & Maintenance Toggles</span>
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Click toggle to switch equipment between Operational and Broken
          </span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hardware Device</th>
                <th>Unit ID</th>
                <th>Current Status</th>
                <th>Facility Action</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((res) => {
                const isAvail = res.status === 'available';
                return (
                  <tr key={res._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Tv size={18} color="#2563eb" />
                        <strong>{res.name}</strong>
                      </div>
                    </td>
                    <td>Unit #{res.unitNumber}</td>
                    <td>
                      <span className={isAvail ? 'badge badge-available' : 'badge badge-broken'}>
                        <span className="badge-dot"></span>
                        {isAvail ? 'Operational' : 'Broken / Needs Repair'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${isAvail ? 'btn-outline-danger' : 'btn-success'}`}
                        disabled={actionLoading}
                        onClick={() => handleToggleResource(res)}
                      >
                        <Wrench size={14} />
                        <span>{isAvail ? 'Mark as Broken' : 'Mark as Fixed & Operational'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Reservations Oversight */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <CalendarCheck size={20} color="#2563eb" />
            <span>Active Reservations & Attendee Check-In Verification</span>
          </h2>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Date</th>
                <th>Time Window</th>
                <th>Resources Requested</th>
                <th>Check-In Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No active confirmed bookings at this time.
                  </td>
                </tr>
              ) : (
                activeBookings.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <strong>{b.roomId?.name || 'Room'}</strong>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Floor {b.roomId?.floor ?? '1'}
                      </div>
                    </td>
                    <td>{b.date ? new Date(b.date).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#1e40af' }}>
                        {b.startTime} - {b.endTime}
                      </span>
                    </td>
                    <td>
                      {b.resources && b.resources.length > 0 ? (
                        b.resources.map((item, idx) => (
                          <span key={idx} className="badge badge-confirmed" style={{ marginRight: '0.25rem' }}>
                            {item.resourceId?.name || 'Item'} #{item.resourceId?.unitNumber || ''}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>None</span>
                      )}
                    </td>
                    <td>
                      {b.checkedIn ? (
                        <span className="badge badge-checked-in">
                          <CheckCircle2 size={12} />
                          Checked In
                        </span>
                      ) : (
                        <span className="badge badge-confirmed">
                          <span className="badge-dot"></span>
                          Pending Check-In
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        {!b.checkedIn && (
                          <button
                            className="btn btn-success btn-sm"
                            disabled={actionLoading}
                            onClick={() => handleCheckIn(b._id)}
                            title="Verify and check in meeting room"
                          >
                            <CheckCircle size={14} />
                            <span>Check-In</span>
                          </button>
                        )}
                        <button
                          className="btn btn-outline-danger btn-sm"
                          disabled={actionLoading}
                          onClick={() => handleCancelBooking(b._id)}
                          title="Cancel booking"
                        >
                          <XCircle size={14} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FacilityDashboard;
