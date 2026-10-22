import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roomApi, bookingApi, waitingListApi } from '../api/axiosClient';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import AlertBanner from '../components/AlertBanner';
import Modal from '../components/Modal';
import {
  Clock,
  DoorOpen,
  Calendar,
  PlusCircle,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
  RotateCw,
} from 'lucide-react';

const WaitingList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Form Fields
  const [roomId, setRoomId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [attendees, setAttendees] = useState(2);
  const [notes, setNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [roomsData, bookingsData, queueData] = await Promise.all([
        roomApi.getAllRooms(),
        bookingApi.getAllBookings(),
        waitingListApi.getWaitingList(),
      ]);

      setRooms(roomsData);
      setBookings(bookingsData);
      setWaitingList(queueData);

      if (roomsData.length > 0 && !roomId) {
        setRoomId(roomsData[0]._id);
      }
    } catch (err) {
      setErrorMsg('Failed to load waiting list from database: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleJoinWaitingList = async (e) => {
    e.preventDefault();
    if (!roomId || !date || !startTime || !endTime) {
      setErrorMsg('Please fill in all time slot fields.');
      return;
    }

    if (startTime >= endTime) {
      setErrorMsg('Start time must be strictly before end time.');
      return;
    }

    try {
      setActionLoading(true);
      setErrorMsg('');
      const res = await waitingListApi.joinWaitingList({
        roomId,
        date,
        startTime,
        endTime,
        attendees: Number(attendees),
        notes: notes.trim(),
      });

      setSuccessMsg(res.data?.message || 'Joined waiting list in MongoDB successfully!');
      setModalOpen(false);
      setNotes('');
      await fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to join waiting list');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveWaitingList = async (id) => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      const res = await waitingListApi.leaveWaitingList(id);
      setSuccessMsg(res.data?.message || 'Removed from waiting list in database.');
      await fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to leave waiting list');
    } finally {
      setActionLoading(false);
    }
  };

  // Inspect slot availability against real bookings
  const checkSlotFree = (item) => {
    if (item.status === 'assigned') return false;
    const targetRoomId = item.roomId?._id || item.roomId;
    const targetDateStr = item.date ? new Date(item.date).toISOString().split('T')[0] : '';

    const conflict = bookings.find((b) => {
      if (b.status !== 'confirmed') return false;
      const bDate = new Date(b.date).toISOString().split('T')[0];
      const sameRoom = (b.roomId?._id || b.roomId) === targetRoomId;
      const sameDate = bDate === targetDateStr;
      const overlap = item.startTime < b.endTime && item.endTime > b.startTime;
      return sameRoom && sameDate && overlap;
    });

    return !conflict;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Waiting List Queue (MongoDB Persisted)</h1>
          <p>
            Join queues for high-demand conference rooms. When a booking is cancelled or auto-released
            by the 15-minute no-show scheduler, slots are reassigned directly in MongoDB.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={fetchData} disabled={actionLoading}>
            <RotateCw size={16} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <PlusCircle size={18} />
            <span>Join Waiting List</span>
          </button>
        </div>
      </div>

      {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Architecture Explanatory Callout */}
      <div
        className="alert alert-info"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.85rem',
          marginBottom: '1.75rem',
        }}
      >
        <Info size={22} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
          <strong>Real-Time MongoDB Integration & Auto-Assignment:</strong> Waiting list entries are saved in
          MongoDB in the <code>waitinglists</code> collection. When any booking is cancelled or auto-cancelled by
          the 15-minute no-show cron scheduler (<code>scheduler/cron.js</code>), the backend automatically assigns
          the freed slot to the earliest eligible queued requester and converts it into a confirmed booking!
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Checking queue and room availability from database..." />
      ) : waitingList.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No Active Waiting List Requests"
          description="There are currently no active waiting list requests recorded in MongoDB."
          actionLabel="Request a Room Slot"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room Requested</th>
                <th>Desired Date</th>
                <th>Time Window</th>
                <th>Requester</th>
                <th>Status in MongoDB</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {waitingList.map((item) => {
                const isNowFree = checkSlotFree(item);
                const roomObj = item.roomId || {};
                const userObj = item.userId || {};

                return (
                  <tr key={item._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <DoorOpen size={18} color="#2563eb" />
                        <div>
                          <strong>{roomObj.name || 'Conference Room'}</strong>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Floor {roomObj.floor ?? '1'} • Capacity {roomObj.capacity ?? 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                        <Calendar size={14} color="#64748b" />
                        <span>{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#1e40af' }}>
                        {item.startTime} – {item.endTime}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                          {userObj.email || user?.email}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {userObj.department || user?.department}
                        </div>
                      </div>
                    </td>
                    <td>
                      {item.status === 'assigned' ? (
                        <span className="badge badge-available">
                          <CheckCircle size={12} />
                          Auto-Assigned! (Booking Created)
                        </span>
                      ) : item.status === 'cancelled' ? (
                        <span className="badge badge-cancelled">Cancelled / Left</span>
                      ) : isNowFree ? (
                        <span className="badge badge-available">
                          <CheckCircle size={12} />
                          Slot Now Free! Ready to Claim
                        </span>
                      ) : (
                        <span className="badge badge-waiting">
                          <Clock size={12} />
                          Waiting in Queue
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {item.status === 'waiting' && isNowFree && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              navigate('/book', {
                                state: { preselectedRoomId: roomObj._id },
                              })
                            }
                          >
                            <span>Claim Slot</span>
                            <ArrowRight size={14} />
                          </button>
                        )}
                        {item.status === 'waiting' && (
                          <button
                            className="btn btn-outline-danger btn-sm"
                            disabled={actionLoading}
                            onClick={() => handleLeaveWaitingList(item._id)}
                            title="Leave Queue"
                          >
                            <Trash2 size={14} />
                            <span>Leave</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Join Waiting List Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Join Meeting Room Waiting List (Saved to MongoDB)"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={actionLoading}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleJoinWaitingList} disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Add to MongoDB Queue'}
            </button>
          </>
        }
      >
        <form onSubmit={handleJoinWaitingList}>
          <div className="form-group">
            <label className="form-label">
              Select Room <span className="required">*</span>
            </label>
            <select
              className="form-control"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              required
            >
              {rooms.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} (Floor {r.floor}, Cap: {r.capacity})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Desired Date <span className="required">*</span>
              </label>
              <input
                type="date"
                className="form-control"
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Attendees</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Start Time <span className="required">*</span>
              </label>
              <input
                type="time"
                className="form-control"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                End Time <span className="required">*</span>
              </label>
              <input
                type="time"
                className="form-control"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Purpose / Notes (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Client sync or Quarterly demo"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WaitingList;
