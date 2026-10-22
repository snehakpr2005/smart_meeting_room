import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { roomApi, bookingApi } from '../api/axiosClient';
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
} from 'lucide-react';

const STORAGE_KEY = 'smart_room_waiting_list';

const WaitingList = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [waitingList, setWaitingList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [roomId, setRoomId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [notes, setNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load rooms and persistent queue
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomsData, bookingsData] = await Promise.all([
          roomApi.getAllRooms(),
          bookingApi.getAllBookings(),
        ]);
        setRooms(roomsData);
        setBookings(bookingsData);

        if (roomsData.length > 0) {
          setRoomId(roomsData[0]._id);
        }

        // Retrieve local queue
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setWaitingList(JSON.parse(saved));
        }
      } catch (err) {
        setErrorMsg('Failed to load waiting list prerequisites: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const saveQueue = (newList) => {
    setWaitingList(newList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  };

  const handleJoinWaitingList = (e) => {
    e.preventDefault();
    if (!roomId || !date || !startTime || !endTime) {
      setErrorMsg('Please fill in all time slot fields.');
      return;
    }

    if (startTime >= endTime) {
      setErrorMsg('Start time must be strictly before end time.');
      return;
    }

    const targetRoom = rooms.find((r) => r._id === roomId);

    const newRequest = {
      id: Date.now().toString(),
      roomId,
      roomName: targetRoom?.name || 'Meeting Room',
      floor: targetRoom?.floor,
      date,
      startTime,
      endTime,
      notes,
      userEmail: user?.email,
      department: user?.department,
      status: 'waiting', // 'waiting' | 'assigned'
      createdAt: new Date().toISOString(),
    };

    const updated = [newRequest, ...waitingList];
    saveQueue(updated);
    setSuccessMsg(`Joined waiting list queue for ${targetRoom?.name}.`);
    setModalOpen(false);
    setNotes('');
  };

  const handleLeaveWaitingList = (id) => {
    const updated = waitingList.filter((item) => item.id !== id);
    saveQueue(updated);
    setSuccessMsg('You have left the waiting list queue.');
  };

  // Inspect slot availability against real bookings
  const checkSlotFree = (item) => {
    const conflict = bookings.find((b) => {
      if (b.status !== 'confirmed') return false;
      const bDate = new Date(b.date).toISOString().split('T')[0];
      const sameRoom = (b.roomId?._id || b.roomId) === item.roomId;
      const sameDate = bDate === item.date;
      const overlap = item.startTime < b.endTime && item.endTime > b.startTime;
      return sameRoom && sameDate && overlap;
    });

    return !conflict;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Waiting List Queue</h1>
          <p>
            Join queues for high-demand conference rooms. When a booked meeting is cancelled or auto-released
            by the 15-minute no-show scheduler, slots are reassigned.
          </p>
        </div>

        <div className="page-header-actions">
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
          <strong>Automated Priority & Release Integration:</strong> The backend scheduler cron (
          <code>scheduler/cron.js</code>) checks every minute for meetings whose start time has exceeded 15
          minutes without a confirmed employee check-in. When auto-cancellation occurs, the slot is immediately
          freed for waiting list members.
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Checking queue and room availability..." />
      ) : waitingList.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No Active Waiting List Requests"
          description="You are not currently in line for any fully-booked meeting rooms."
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
                <th>Slot Availability Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {waitingList.map((item) => {
                const isNowFree = checkSlotFree(item);

                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <DoorOpen size={18} color="#2563eb" />
                        <div>
                          <strong>{item.roomName}</strong>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Floor {item.floor}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                        <Calendar size={14} color="#64748b" />
                        <span>{item.date}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#1e40af' }}>
                        {item.startTime} – {item.endTime}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.userEmail}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.department}</div>
                      </div>
                    </td>
                    <td>
                      {isNowFree ? (
                        <span className="badge badge-available">
                          <CheckCircle size={12} />
                          Slot Now Free! Ready to Book
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
                        {isNowFree && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              (window.location.href = `/book?room=${item.roomId}&date=${item.date}`)
                            }
                          >
                            <span>Claim Slot</span>
                            <ArrowRight size={14} />
                          </button>
                        )}
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleLeaveWaitingList(item.id)}
                          title="Leave Queue"
                        >
                          <Trash2 size={14} />
                          <span>Leave</span>
                        </button>
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
        title="Join Meeting Room Waiting List"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleJoinWaitingList}>
              Add to Queue
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
