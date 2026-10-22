import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roomApi } from '../api/axiosClient';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import AlertBanner from '../components/AlertBanner';
import Modal from '../components/Modal';
import {
  DoorOpen,
  Search,
  Filter,
  Users,
  Building,
  PlusCircle,
  CalendarPlus,
  Trash2,
  Edit2,
} from 'lucide-react';

const Rooms = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [floorFilter, setFloorFilter] = useState('ALL');
  const [capacityFilter, setCapacityFilter] = useState('ALL');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Admin Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState('');

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await roomApi.getAllRooms();
      setRooms(data);
    } catch (err) {
      setErrorMsg('Failed to load rooms: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName || !newRoomCapacity || !newRoomFloor) {
      setErrorMsg('All room fields are required');
      return;
    }

    try {
      setModalLoading(true);
      setErrorMsg('');
      await roomApi.createRoom({
        name: newRoomName.trim(),
        capacity: Number(newRoomCapacity),
        floor: Number(newRoomFloor),
      });

      setSuccessMsg(`Room "${newRoomName}" added successfully.`);
      setIsAddModalOpen(false);
      setNewRoomName('');
      setNewRoomCapacity('');
      setNewRoomFloor('');
      await fetchRooms();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create room');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId, roomName) => {
    if (!window.confirm(`Are you sure you want to delete room "${roomName}"?`)) return;
    try {
      setLoading(true);
      await roomApi.deleteRoom(roomId);
      setSuccessMsg(`Room "${roomName}" deleted.`);
      await fetchRooms();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete room');
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r.floor).includes(searchTerm);

    const matchesFloor = floorFilter === 'ALL' || String(r.floor) === floorFilter;

    let matchesCapacity = true;
    if (capacityFilter === 'SMALL') matchesCapacity = r.capacity <= 6;
    if (capacityFilter === 'MEDIUM') matchesCapacity = r.capacity > 6 && r.capacity <= 15;
    if (capacityFilter === 'LARGE') matchesCapacity = r.capacity > 15;

    return matchesSearch && matchesFloor && matchesCapacity;
  });

  const uniqueFloors = Array.from(new Set(rooms.map((r) => String(r.floor)))).sort();

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Meeting Rooms Directory</h1>
          <p>
            Explore all available meeting rooms, inspect seating capacities, and reserve spaces for your team.
          </p>
        </div>

        {user?.role === 'admin' && (
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <PlusCircle size={18} />
              <span>Add New Room</span>
            </button>
          </div>
        )}
      </div>

      {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Search and Filters Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search by room name or floor..."
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Floor Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="#64748b" />
            <select
              className="form-control"
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
            >
              <option value="ALL">All Floors</option>
              {uniqueFloors.map((fl) => (
                <option key={fl} value={fl}>
                  Floor {fl}
                </option>
              ))}
            </select>
          </div>

          {/* Capacity Filter */}
          <div>
            <select
              className="form-control"
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
            >
              <option value="ALL">All Capacities</option>
              <option value="SMALL">Small (1 - 6 persons)</option>
              <option value="MEDIUM">Medium (7 - 15 persons)</option>
              <option value="LARGE">Large (16+ persons)</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching meeting rooms from database..." />
      ) : filteredRooms.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title="No Rooms Found"
          description={
            rooms.length === 0
              ? 'There are no meeting rooms recorded in MongoDB yet.'
              : 'No meeting rooms match your selected search or filter criteria.'
          }
          actionLabel={user?.role === 'admin' ? 'Add a Room' : 'Clear Filters'}
          onAction={() => {
            if (user?.role === 'admin' && rooms.length === 0) {
              setIsAddModalOpen(true);
            } else {
              setSearchTerm('');
              setFloorFilter('ALL');
              setCapacityFilter('ALL');
            }
          }}
        />
      ) : (
        <div className="room-grid">
          {filteredRooms.map((room) => (
            <div key={room._id} className="room-card">
              <div>
                <div className="room-card-header">
                  <h3 className="room-title">{room.name}</h3>
                  <span className="badge badge-available">
                    <span className="badge-dot"></span>
                    Operational
                  </span>
                </div>

                <div className="room-specs">
                  <div className="room-spec-item">
                    <Users size={18} />
                    <span>
                      Max Capacity: <strong>{room.capacity} Attendees</strong>
                    </span>
                  </div>
                  <div className="room-spec-item">
                    <Building size={18} />
                    <span>
                      Location: <strong>Building Wing • Floor {room.floor}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  className="btn btn-primary btn-block btn-sm"
                  onClick={() => navigate('/book', { state: { preselectedRoomId: room._id } })}
                >
                  <CalendarPlus size={16} />
                  <span>Book This Room</span>
                </button>

                {user?.role === 'admin' && (
                  <button
                    className="btn btn-outline-danger btn-sm"
                    title="Delete Room"
                    onClick={() => handleDeleteRoom(room._id, room.name)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Add Room Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Meeting Room"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
              disabled={modalLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateRoom}
              disabled={modalLoading}
            >
              {modalLoading ? 'Saving...' : 'Save Room'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateRoom}>
          <div className="form-group">
            <label className="form-label">
              Room Name <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Summit Hall, Strategy Hub"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Capacity (People) <span className="required">*</span>
              </label>
              <input
                type="number"
                min="1"
                className="form-control"
                placeholder="e.g. 12"
                value={newRoomCapacity}
                onChange={(e) => setNewRoomCapacity(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Floor Number <span className="required">*</span>
              </label>
              <input
                type="number"
                min="1"
                className="form-control"
                placeholder="e.g. 3"
                value={newRoomFloor}
                onChange={(e) => setNewRoomFloor(e.target.value)}
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Rooms;
