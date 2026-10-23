import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roomApi, bookingApi, waitingListApi } from '../api/axiosClient';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import AlertBanner from '../components/AlertBanner';
import Modal from '../components/Modal';
import {
  Clock, DoorOpen, Calendar, PlusCircle, Trash2, CheckCircle,
  AlertCircle, Info, ArrowRight, RotateCw, ListOrdered, Zap,
} from 'lucide-react';

/* ── Colour-coded queue position badge ───────────────────────── */
const QueueBadge = ({ position }) => {
  const colors = ['#7c3aed', '#2563eb', '#0891b2', '#059669'];
  const bg = colors[Math.min(position - 1, colors.length - 1)] || '#64748b';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 26, height: 26, borderRadius: '50%', background: bg, color: '#fff',
      fontSize: '0.78rem', fontWeight: 800, flexShrink: 0,
    }}>#{position}</span>
  );
};

const WaitingList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Form fields for joining
  const [roomId, setRoomId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [attendees, setAttendees] = useState(2);
  const [notes, setNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Active filter: 'all' | 'waiting' | 'assigned' | 'cancelled'
  const [filter, setFilter] = useState('all');

  const fetchData = useCallback(async () => {
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
      setErrorMsg('Failed to load waiting list: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchData();
  }, []);

  /* ── Join queue ─── */
  const handleJoinWaitingList = async (e) => {
    e.preventDefault();
    if (!roomId || !date || !startTime || !endTime) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (startTime >= endTime) {
      setErrorMsg('Start time must be before end time.');
      return;
    }

    try {
      setActionLoading(true);
      setErrorMsg('');
      const res = await waitingListApi.joinWaitingList({
        roomId, date, startTime, endTime,
        attendees: Number(attendees),
        notes: notes.trim(),
      });

      setSuccessMsg(res.data?.message || 'Added to waiting list queue!');
      setModalOpen(false);
      setNotes('');
      await fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to join waiting list.');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Leave queue ─── */
  const handleLeaveWaitingList = async (id) => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      const res = await waitingListApi.leaveWaitingList(id);
      setSuccessMsg(res.data?.message || 'Removed from waiting list.');
      await fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to leave waiting list.');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Is the slot now free? (for live "Claim" button) ─── */
  const checkSlotFree = (item) => {
    if (item.status === 'assigned') return false;
    const targetRoomId = item.roomId?._id || item.roomId;
    const targetDateStr = item.date ? new Date(item.date).toISOString().split('T')[0] : '';
    const conflict = bookings.find(b => {
      if (b.status !== 'confirmed') return false;
      const bDate = new Date(b.date).toISOString().split('T')[0];
      const sameRoom = (b.roomId?._id || b.roomId) === targetRoomId;
      const sameDate = bDate === targetDateStr;
      const overlap = item.startTime < b.endTime && item.endTime > b.startTime;
      return sameRoom && sameDate && overlap;
    });
    return !conflict;
  };

  /* ── Queue position among 'waiting' entries for same room/date/slot ─── */
  const getQueuePosition = (item) => {
    const sameSlot = waitingList.filter(w =>
      w.status === 'waiting' &&
      (w.roomId?._id || w.roomId) === (item.roomId?._id || item.roomId) &&
      new Date(w.date).toISOString().split('T')[0] === new Date(item.date).toISOString().split('T')[0] &&
      w.startTime === item.startTime && w.endTime === item.endTime
    ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const pos = sameSlot.findIndex(w => w._id === item._id);
    return pos === -1 ? null : pos + 1;
  };

  const filteredList = waitingList.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const countByStatus = (s) => waitingList.filter(i => i.status === s).length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Waiting List Queue</h1>
          <p>
            Join queues for high-demand rooms. When a booking is cancelled or auto-released by the
            15-minute no-show scheduler, the slot is immediately assigned to the first person in the queue.
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

      {/* Info callout */}
      <div className="alert alert-info" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '1.75rem' }}>
        <Info size={22} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
          <strong>How Auto-Assignment Works:</strong> When any booking is cancelled or auto-cancelled
          by the 15-minute no-show cron, the backend instantly creates a <em>confirmed booking</em> for
          the first waiting user (FIFO order). Your queue position is shown alongside each request.
          You can also <strong>Claim Slot</strong> instantly if the slot becomes free before assignment.
        </div>
      </div>

      {/* Summary stats */}
      {waitingList.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Requests', count: waitingList.length, color: '#2563eb' },
            { label: 'Waiting in Queue', count: countByStatus('waiting'), color: '#d97706' },
            { label: 'Auto-Assigned', count: countByStatus('assigned'), color: '#059669' },
            { label: 'Cancelled / Left', count: countByStatus('cancelled'), color: '#64748b' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
              padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <strong style={{ fontSize: '1.1rem', color: s.color }}>{s.count}</strong>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="tabs-container" style={{ marginBottom: '1rem' }}>
        {['all', 'waiting', 'assigned', 'cancelled'].map(tab => (
          <button key={tab} className={`tab-btn ${filter === tab ? 'active' : ''}`} onClick={() => setFilter(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span style={{
              fontSize: '0.72rem', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontWeight: 700,
              background: filter === tab ? 'var(--primary-100)' : '#e2e8f0',
              color: filter === tab ? 'var(--primary-800)' : '#64748b',
            }}>
              {tab === 'all' ? waitingList.length : countByStatus(tab)}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching queue from database..." />
      ) : filteredList.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={filter === 'all' ? 'No Waiting List Requests' : `No "${filter}" requests`}
          description={
            filter === 'all'
              ? 'There are no active waiting list requests. Join a queue if your desired room slot is taken.'
              : `No requests with status "${filter}" found.`
          }
          actionLabel="Request a Room Slot"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Queue #</th>
                <th>Room Requested</th>
                <th>Date</th>
                <th>Time Window</th>
                <th>Requester</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map(item => {
                const isNowFree = checkSlotFree(item);
                const roomObj = item.roomId || {};
                const userObj = item.userId || {};
                const queuePos = item.status === 'waiting' ? getQueuePosition(item) : null;

                return (
                  <tr key={item._id}>
                    <td>
                      {item.status === 'waiting' && queuePos
                        ? <QueueBadge position={queuePos} />
                        : <span className="text-muted" style={{ fontSize: '0.8rem' }}>—</span>}
                    </td>
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
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{userObj.email || user?.email}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{userObj.department || user?.department}</div>
                        {item.notes && (
                          <div style={{ fontSize: '0.75rem', color: '#475569', fontStyle: 'italic', marginTop: '0.2rem' }}>
                            "{item.notes}"
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {item.status === 'assigned' ? (
                        <span className="badge badge-available">
                          <CheckCircle size={12} /> Auto-Assigned ✓
                        </span>
                      ) : item.status === 'cancelled' ? (
                        <span className="badge badge-cancelled">Cancelled / Left</span>
                      ) : isNowFree ? (
                        <span className="badge badge-available" style={{ background: '#ecfdf5', color: '#059669' }}>
                          <Zap size={12} /> Slot is Now Free!
                        </span>
                      ) : (
                        <span className="badge badge-waiting">
                          <Clock size={12} /> Waiting in Queue
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {item.status === 'waiting' && isNowFree && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate('/book', { state: { preselectedRoomId: roomObj._id } })}
                          >
                            <span>Claim Slot</span>
                            <ArrowRight size={14} />
                          </button>
                        )}
                        {item.status === 'assigned' && item.assignedBookingId && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate('/my-bookings')}
                          >
                            <span>View Booking</span>
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
        title="Join Room Waiting Queue"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={actionLoading}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleJoinWaitingList} disabled={actionLoading}>
              <ListOrdered size={16} />
              {actionLoading ? 'Joining...' : 'Join Queue'}
            </button>
          </>
        }
      >
        <form onSubmit={handleJoinWaitingList}>
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', fontSize: '0.84rem', color: '#1e40af', lineHeight: 1.5 }}>
            <strong>FIFO Auto-Assignment:</strong> You'll be placed in a queue. When the slot becomes free
            (cancellation or no-show), you'll automatically get a confirmed booking — no action needed.
          </div>

          <div className="form-group">
            <label className="form-label">Select Room <span className="required">*</span></label>
            <select className="form-control" value={roomId} onChange={e => setRoomId(e.target.value)} required>
              {rooms.map(r => (
                <option key={r._id} value={r._id}>
                  {r.name} (Floor {r.floor}, Cap: {r.capacity})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Desired Date <span className="required">*</span></label>
              <input type="date" className="form-control"
                min={new Date().toISOString().split('T')[0]}
                value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Attendees</label>
              <input type="number" min="1" className="form-control"
                value={attendees} onChange={e => setAttendees(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Time <span className="required">*</span></label>
              <input type="time" className="form-control" value={startTime} onChange={e => setStartTime(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">End Time <span className="required">*</span></label>
              <input type="time" className="form-control" value={endTime} onChange={e => setEndTime(e.target.value)} required />
            </div>
          </div>

          {startTime >= endTime && (
            <div style={{ color: '#dc2626', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              ⚠ End time must be after start time.
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Purpose / Notes <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span></label>
            <input type="text" className="form-control"
              placeholder="e.g., Client sync, Quarterly review..."
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WaitingList;
