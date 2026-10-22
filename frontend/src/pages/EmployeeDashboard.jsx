import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roomApi, resourceApi, bookingApi } from '../api/axiosClient';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import EmptyState from '../components/EmptyState';
import {
  DoorOpen,
  Calendar,
  CalendarCheck,
  Tv,
  PlusCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Users,
  Building,
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const [roomsData, resourcesData, bookingsData] = await Promise.all([
        roomApi.getAllRooms(),
        resourceApi.getAllResources(),
        bookingApi.getAllBookings(),
      ]);

      setRooms(roomsData);
      setResources(resourcesData);
      setBookings(bookingsData);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setErrorMsg('Failed to load system dashboard data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckIn = async (bookingId) => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      const res = await bookingApi.checkInBooking(bookingId);
      setSuccessMsg(res.data?.message || 'Checked in successfully! Meeting room is active.');
      await fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard and room schedules..." />;
  }

  // Compute metrics
  const todayDateStr = new Date().toISOString().split('T')[0];

  const todayBookings = bookings.filter((b) => {
    if (!b.date) return false;
    const bDate = new Date(b.date).toISOString().split('T')[0];
    return bDate === todayDateStr && b.status === 'confirmed';
  });

  const upcomingBookings = bookings.filter((b) => {
    if (!b.date) return false;
    const bDate = new Date(b.date).toISOString().split('T')[0];
    return bDate >= todayDateStr && b.status === 'confirmed';
  });

  const availableResourcesCount = resources.filter((r) => r.status === 'available').length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>Employee Workspace</h1>
          <p>
            Welcome back, <strong>{user?.email}</strong> ({user?.department} Department). Manage your
            conference rooms and booked resources.
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/book')}>
            <PlusCircle size={18} />
            <span>Quick Book Room</span>
          </button>
        </div>
      </div>

      {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* KPI Cards */}
      <div className="stat-card-grid">
        <StatCard
          title="Total Meeting Rooms"
          value={rooms.length}
          subtitle="Configured in organization"
          icon={DoorOpen}
          colorTheme="blue"
        />
        <StatCard
          title="Today's Active Meetings"
          value={todayBookings.length}
          subtitle="Confirmed for today"
          icon={Calendar}
          colorTheme="green"
        />
        <StatCard
          title="Upcoming Bookings"
          value={upcomingBookings.length}
          subtitle="Future schedule"
          icon={CalendarCheck}
          colorTheme="purple"
        />
        <StatCard
          title="Available Resources"
          value={`${availableResourcesCount} / ${resources.length}`}
          subtitle="Active equipment units"
          icon={Tv}
          colorTheme="amber"
        />
      </div>

      {/* Automated Scheduler Notice */}
      <div
        className="alert alert-info"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock size={20} color="#2563eb" />
          <div>
            <strong>15-Minute No-Show Auto Cancellation:</strong> If you don't check in within 15 minutes of the
            booking start time, the system cron automatically cancels your reservation so others can use the room.
          </div>
        </div>
      </div>

      {/* Today's Schedule Table */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h2 className="card-title">
            <Calendar size={20} color="#2563eb" />
            <span>Your Schedule & Today's Bookings</span>
          </h2>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/my-bookings')}>
            <span>View All Bookings</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {todayBookings.length === 0 ? (
          <EmptyState
            title="No Bookings Today"
            description="You don't have any meeting room bookings scheduled for today."
            actionLabel="Book a Room Now"
            onAction={() => navigate('/book')}
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Room Name</th>
                  <th>Floor</th>
                  <th>Time Slot</th>
                  <th>Assigned Resources</th>
                  <th>Status</th>
                  <th>Check-In Action</th>
                </tr>
              </thead>
              <tbody>
                {todayBookings.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <strong>{b.roomId?.name || 'Meeting Room'}</strong>
                    </td>
                    <td>Floor {b.roomId?.floor ?? '1'}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#1e40af' }}>
                        {b.startTime} - {b.endTime}
                      </span>
                    </td>
                    <td>
                      {b.resources && b.resources.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {b.resources.map((item, idx) => (
                            <span key={idx} className="badge badge-confirmed">
                              {item.resourceId?.name || 'Device'} #{item.resourceId?.unitNumber || ''} (x{item.quantity})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>None</span>
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
                          Confirmed
                        </span>
                      )}
                    </td>
                    <td>
                      {b.checkedIn ? (
                        <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: 600 }}>
                          ✓ Completed
                        </span>
                      ) : (
                        <button
                          className="btn btn-success btn-sm"
                          disabled={actionLoading}
                          onClick={() => handleCheckIn(b._id)}
                        >
                          Check In Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Available Rooms Preview */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <DoorOpen size={20} color="#2563eb" />
            <span>Available Conference Rooms</span>
          </h2>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/rooms')}>
            <span>Browse All Rooms</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {rooms.length === 0 ? (
          <EmptyState
            title="No Rooms Available"
            description="No conference rooms are currently registered in the database."
          />
        ) : (
          <div className="room-grid">
            {rooms.slice(0, 3).map((room) => (
              <div key={room._id} className="room-card">
                <div>
                  <div className="room-card-header">
                    <h3 className="room-title">{room.name}</h3>
                    <span className="badge badge-available">
                      <span className="badge-dot"></span>
                      Available
                    </span>
                  </div>

                  <div className="room-specs">
                    <div className="room-spec-item">
                      <Users size={16} />
                      <span>Capacity: <strong>{room.capacity} People</strong></span>
                    </div>
                    <div className="room-spec-item">
                      <Building size={16} />
                      <span>Location: <strong>Floor {room.floor}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-block btn-sm"
                  onClick={() => navigate('/book', { state: { preselectedRoomId: room._id } })}
                >
                  <PlusCircle size={16} />
                  <span>Reserve This Room</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
