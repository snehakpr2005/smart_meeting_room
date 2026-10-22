import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { roomApi, resourceApi, bookingApi, authApi } from '../api/axiosClient';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import Modal from '../components/Modal';
import {
  Shield,
  DoorOpen,
  Tv,
  CalendarCheck,
  UserPlus,
  PlusCircle,
  Trash2,
  Wrench,
  CheckCircle2,
  XCircle,
  Building,
  Users,
  Briefcase,
  Clock,
  Layers,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [rooms, setRooms] = useState([]);
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'rooms' | 'resources' | 'bookings' | 'users'
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Room modal
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomCapacity, setRoomCapacity] = useState('');
  const [roomFloor, setRoomFloor] = useState('');

  // Resource modal
  const [resModalOpen, setResModalOpen] = useState(false);
  const [resName, setResName] = useState('Projector');
  const [resUnitNumber, setResUnitNumber] = useState('');
  const [resStatus, setResStatus] = useState('available');

  // Staff creation modal
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffType, setStaffType] = useState('facility_manager'); // 'facility_manager' | 'employee'
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('Staff@123');
  const [staffDepartment, setStaffDepartment] = useState('Management');

  const fetchAllData = async () => {
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
      setErrorMsg('Failed to load administrative dataset: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Room CRUD Handlers
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setErrorMsg('');
      await roomApi.createRoom({
        name: roomName.trim(),
        capacity: Number(roomCapacity),
        floor: Number(roomFloor),
      });
      setSuccessMsg(`Room "${roomName}" created.`);
      setRoomModalOpen(false);
      setRoomName('');
      setRoomCapacity('');
      setRoomFloor('');
      await fetchAllData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create room');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRoom = async (id, name) => {
    if (!window.confirm(`Delete room "${name}"?`)) return;
    try {
      setActionLoading(true);
      await roomApi.deleteRoom(id);
      setSuccessMsg(`Room "${name}" removed.`);
      await fetchAllData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete room');
    } finally {
      setActionLoading(false);
    }
  };

  // Resource CRUD Handlers
  const handleCreateResource = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setErrorMsg('');
      await resourceApi.createResource({
        name: resName.trim(),
        unitNumber: Number(resUnitNumber),
        status: resStatus,
      });
      setSuccessMsg(`Resource "${resName} #${resUnitNumber}" created.`);
      setResModalOpen(false);
      setResUnitNumber('');
      await fetchAllData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create resource');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleResourceStatus = async (res) => {
    const nextStatus = res.status === 'available' ? 'broken' : 'available';
    try {
      setActionLoading(true);
      await resourceApi.updateResource(res._id, {
        name: res.name,
        unitNumber: res.unitNumber,
        status: nextStatus,
      });
      setSuccessMsg(`Updated ${res.name} #${res.unitNumber} status to ${nextStatus}.`);
      await fetchAllData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update resource');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteResource = async (res) => {
    if (!window.confirm(`Delete ${res.name} #${res.unitNumber}?`)) return;
    try {
      setActionLoading(true);
      await resourceApi.deleteResource(res._id);
      setSuccessMsg(`Deleted ${res.name} #${res.unitNumber}.`);
      await fetchAllData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete resource');
    } finally {
      setActionLoading(false);
    }
  };

  // Booking Actions
  const handleCheckInBooking = async (id) => {
    try {
      setActionLoading(true);
      await bookingApi.checkInBooking(id);
      setSuccessMsg('Booking checked in successfully.');
      await fetchAllData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to check in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking on behalf of the organization?')) return;
    try {
      setActionLoading(true);
      await bookingApi.cancelBooking(id);
      setSuccessMsg('Booking cancelled.');
      await fetchAllData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  // Staff creation (Facility Manager or Employee)
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setErrorMsg('');

      if (staffType === 'facility_manager') {
        await authApi.createFacilityManager({
          department: staffDepartment,
          email: staffEmail.trim(),
          password: staffPassword,
        });
        setSuccessMsg(`Facility Manager "${staffEmail}" registered successfully!`);
      } else {
        await authApi.register({
          department: staffDepartment,
          email: staffEmail.trim(),
          password: staffPassword,
        });
        setSuccessMsg(`Employee account "${staffEmail}" registered successfully!`);
      }

      setStaffModalOpen(false);
      setStaffEmail('');
      setStaffPassword('Staff@123');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to register account');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading administrative dashboard metrics..." />;
  }

  const confirmedBookingsCount = bookings.filter((b) => b.status === 'confirmed').length;
  const brokenResourcesCount = resources.filter((r) => r.status === 'broken').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Admin Operations Console</h1>
          <p>
            Complete system governance for rooms, shared inventory, reservations, and facility staff.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setStaffModalOpen(true)}>
            <UserPlus size={16} />
            <span>Create Staff Account</span>
          </button>
        </div>
      </div>

      {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* KPI Stats */}
      <div className="stat-card-grid">
        <StatCard
          title="Meeting Rooms"
          value={rooms.length}
          subtitle="Managed in system"
          icon={DoorOpen}
          colorTheme="blue"
        />
        <StatCard
          title="Total Hardware Units"
          value={resources.length}
          subtitle={`${brokenResourcesCount} broken / under repair`}
          icon={Tv}
          colorTheme="amber"
        />
        <StatCard
          title="Total Bookings"
          value={bookings.length}
          subtitle={`${confirmedBookingsCount} active reservations`}
          icon={CalendarCheck}
          colorTheme="green"
        />
        <StatCard
          title="System Security"
          value="JWT Active"
          subtitle="Role-based authorization"
          icon={Shield}
          colorTheme="purple"
        />
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Layers size={16} />
          <span>System Overview</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          <DoorOpen size={16} />
          <span>Room Management ({rooms.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          <Tv size={16} />
          <span>Resource Devices ({resources.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <CalendarCheck size={16} />
          <span>All Bookings ({bookings.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {/* Quick Room Management Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <DoorOpen size={20} color="#2563eb" />
                <span>Conference Rooms Quick View</span>
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setRoomModalOpen(true)}>
                <PlusCircle size={14} />
                <span>Add Room</span>
              </button>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Capacity</th>
                    <th>Floor</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.slice(0, 5).map((r) => (
                    <tr key={r._id}>
                      <td><strong>{r.name}</strong></td>
                      <td>{r.capacity} Seats</td>
                      <td>Floor {r.floor}</td>
                      <td>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDeleteRoom(r._id, r.name)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Equipment Status Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Tv size={20} color="#2563eb" />
                <span>Hardware Maintenance Watch</span>
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setResModalOpen(true)}>
                <PlusCircle size={14} />
                <span>Add Equipment</span>
              </button>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Unit #</th>
                    <th>Status</th>
                    <th>Quick Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.slice(0, 5).map((res) => (
                    <tr key={res._id}>
                      <td><strong>{res.name}</strong></td>
                      <td>#{res.unitNumber}</td>
                      <td>
                        <span className={res.status === 'available' ? 'badge badge-available' : 'badge badge-broken'}>
                          {res.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          onClick={() => handleToggleResourceStatus(res)}
                        >
                          {res.status === 'available' ? 'Set Broken' : 'Set Available'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROOM MANAGEMENT */}
      {activeTab === 'rooms' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Room Catalog & Floor Configuration</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setRoomModalOpen(true)}>
              <PlusCircle size={16} />
              <span>Create New Room</span>
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Room Name</th>
                  <th>Seating Capacity</th>
                  <th>Floor Number</th>
                  <th>Registered On</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <DoorOpen size={18} color="#2563eb" />
                        <strong>{r.name}</strong>
                      </div>
                    </td>
                    <td>{r.capacity} People</td>
                    <td>Floor {r.floor}</td>
                    <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDeleteRoom(r._id, r.name)}
                      >
                        <Trash2 size={14} />
                        <span>Delete Room</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RESOURCE DEVICES */}
      {activeTab === 'resources' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Hardware Inventory & Health</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setResModalOpen(true)}>
              <PlusCircle size={16} />
              <span>Add Resource Unit</span>
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Device Category</th>
                  <th>Unit Number</th>
                  <th>Operational Status</th>
                  <th>Status Toggle</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((res) => (
                  <tr key={res._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Tv size={18} color="#2563eb" />
                        <strong>{res.name}</strong>
                      </div>
                    </td>
                    <td>Unit #{res.unitNumber}</td>
                    <td>
                      <span className={res.status === 'available' ? 'badge badge-available' : 'badge badge-broken'}>
                        <span className="badge-dot"></span>
                        {res.status === 'available' ? 'Available' : 'Broken'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${res.status === 'available' ? 'btn-outline-danger' : 'btn-success'}`}
                        onClick={() => handleToggleResourceStatus(res)}
                      >
                        <Wrench size={12} />
                        <span>{res.status === 'available' ? 'Mark Broken' : 'Mark Available'}</span>
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDeleteResource(res)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ALL BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">All Reservations Across Organization</h2>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Allocated Hardware</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Administrative Override</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <strong>{b.roomId?.name || 'Room (Removed)'}</strong>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Floor {b.roomId?.floor ?? '1'}</div>
                    </td>
                    <td>{b.date ? new Date(b.date).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#1e40af' }}>
                        {b.startTime} - {b.endTime}
                      </span>
                    </td>
                    <td>
                      {b.resources && b.resources.length > 0 ? (
                        b.resources.map((r, i) => (
                          <span key={i} className="badge badge-confirmed" style={{ marginRight: '0.25rem' }}>
                            {r.resourceId?.name || 'Item'} #{r.resourceId?.unitNumber || ''}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>None</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={
                          b.status === 'confirmed'
                            ? b.checkedIn
                              ? 'badge badge-checked-in'
                              : 'badge badge-confirmed'
                            : b.status === 'completed'
                            ? 'badge badge-completed'
                            : 'badge badge-cancelled'
                        }
                      >
                        {b.status} {b.checkedIn ? '(Checked In)' : ''}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        {b.status === 'confirmed' && !b.checkedIn && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleCheckInBooking(b._id)}
                            title="Force check in on behalf of user"
                          >
                            <CheckCircle2 size={12} />
                            <span>Check-In</span>
                          </button>
                        )}
                        {b.status === 'confirmed' && (
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleCancelBooking(b._id)}
                            title="Cancel booking"
                          >
                            <XCircle size={12} />
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
        </div>
      )}

      {/* Modal: Create Room */}
      <Modal
        isOpen={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        title="Add Meeting Room"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRoomModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateRoom} disabled={actionLoading}>
              Save Room
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateRoom}>
          <div className="form-group">
            <label className="form-label">Room Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Summit Hall, Strategy Hub"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Capacity (People) *</label>
              <input
                type="number"
                min="1"
                className="form-control"
                placeholder="e.g. 10"
                value={roomCapacity}
                onChange={(e) => setRoomCapacity(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Floor *</label>
              <input
                type="number"
                min="1"
                className="form-control"
                placeholder="e.g. 2"
                value={roomFloor}
                onChange={(e) => setRoomFloor(e.target.value)}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Resource */}
      <Modal
        isOpen={resModalOpen}
        onClose={() => setResModalOpen(false)}
        title="Add Shared Equipment"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setResModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateResource} disabled={actionLoading}>
              Save Equipment
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateResource}>
          <div className="form-group">
            <label className="form-label">Device Type *</label>
            <select
              className="form-control"
              value={resName}
              onChange={(e) => setResName(e.target.value)}
              required
            >
              <option value="Projector">Projector</option>
              <option value="TV">TV</option>
              <option value="Speaker">Speaker</option>
              <option value="Video Camera">Video Camera</option>
              <option value="Conference Phone">Conference Phone</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Unit Number *</label>
            <input
              type="number"
              min="1"
              className="form-control"
              placeholder="e.g. 3"
              value={resUnitNumber}
              onChange={(e) => setResUnitNumber(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Initial Status</label>
            <select
              className="form-control"
              value={resStatus}
              onChange={(e) => setResStatus(e.target.value)}
            >
              <option value="available">Available</option>
              <option value="broken">Broken</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Staff Account */}
      <Modal
        isOpen={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        title="Register Staff Account"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setStaffModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateStaff} disabled={actionLoading}>
              Create Account
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateStaff}>
          <div className="form-group">
            <label className="form-label">Role Category *</label>
            <select
              className="form-control"
              value={staffType}
              onChange={(e) => setStaffType(e.target.value)}
            >
              <option value="facility_manager">Facility Manager (Backend: /createfacilitymanager)</option>
              <option value="employee">Standard Employee (Backend: /register)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Department *</label>
            <select
              className="form-control"
              value={staffDepartment}
              onChange={(e) => setStaffDepartment(e.target.value)}
            >
              <option value="Management">Management</option>
              <option value="IT">IT</option>
              <option value="Travel Agency">Travel Agency</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Staff Email *</label>
            <input
              type="email"
              className="form-control"
              placeholder="staff.name@company.com"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Default Password *</label>
            <input
              type="text"
              className="form-control"
              value={staffPassword}
              onChange={(e) => setStaffPassword(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
