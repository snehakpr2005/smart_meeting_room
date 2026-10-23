import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { roomApi, resourceApi, bookingApi, waitingListApi } from '../api/axiosClient';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import {
  CalendarPlus, DoorOpen, Calendar, Clock, Users, CheckCircle,
  AlertTriangle, ArrowRight, Lightbulb, MapPin, RotateCw,
  PlusCircle, ListOrdered, ChevronRight, Info, Zap
} from 'lucide-react';

/* ── tiny helpers ─────────────────────────────────────────────── */
const toMins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

/* ── Availability Timeline ────────────────────────────────────── */
const AvailabilityTimeline = ({ slots }) => {
  const WORK_START = 8 * 60;
  const WORK_END = 20 * 60;
  const total = WORK_END - WORK_START;

  const pct = (t) => ((toMins(t) - WORK_START) / total) * 100;

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: 600 }}>
        Room Schedule Today (08:00 – 20:00)
      </div>
      <div style={{
        position: 'relative', height: 28, background: 'linear-gradient(90deg,#dcfce7,#dcfce7)',
        borderRadius: 8, overflow: 'hidden', border: '1px solid #bbf7d0'
      }}>
        {slots.map((s, i) => {
          const left = Math.max(0, pct(s.startTime));
          const width = Math.min(100 - left, pct(s.endTime) - left);
          return (
            <div key={i} title={`Booked: ${s.startTime}–${s.endTime}`} style={{
              position: 'absolute', left: `${left}%`, width: `${width}%`,
              height: '100%', background: 'rgba(220,38,38,0.75)', borderRadius: 4,
            }} />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>
        <span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.75rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 2, display: 'inline-block' }} /> Free
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, background: 'rgba(220,38,38,0.75)', borderRadius: 2, display: 'inline-block' }} /> Booked
        </span>
      </div>
    </div>
  );
};

/* ── Suggestions Panel ────────────────────────────────────────── */
const SuggestionsPanel = ({ suggestions, onRoomSelect, onSlotSelect, onDateSelect, onJoinWaiting, conflictData }) => {
  const { alternativeRooms = [], alternativeSlots = [], nearbyDates = [] } = suggestions;
  const hasAnything = alternativeRooms.length || alternativeSlots.length || nearbyDates.length;

  return (
    <div style={{
      marginTop: '1.25rem', border: '1.5px solid #fbbf24', borderRadius: 12,
      background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', padding: '1.25rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
        <Lightbulb size={20} color="#d97706" />
        <strong style={{ color: '#92400e', fontSize: '0.95rem' }}>Smart Suggestions</strong>
      </div>

      {/* Join Waiting List CTA */}
      {conflictData && (
        <div style={{
          background: '#fff', borderRadius: 8, padding: '0.9rem 1rem', marginBottom: '1rem',
          border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ListOrdered size={18} color="#2563eb" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e3a8a' }}>Join the Waiting List</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Get auto-assigned if this slot frees up via cancellation or no-show.
              </div>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onJoinWaiting}>
            <PlusCircle size={14} />
            <span>Join Queue</span>
          </button>
        </div>
      )}

      {!hasAnything && (
        <p style={{ fontSize: '0.85rem', color: '#78716c', fontStyle: 'italic' }}>No alternative suggestions found.</p>
      )}

      {/* Alternative Rooms */}
      {alternativeRooms.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <DoorOpen size={13} style={{ marginRight: 4 }} />Available Rooms for Same Time Slot
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {alternativeRooms.map(r => (
              <button key={r._id} onClick={() => onRoomSelect(r._id)} style={{
                padding: '0.4rem 0.85rem', borderRadius: 20, border: '1px solid #d97706',
                background: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.35rem',
                transition: 'all 0.15s'
              }}>
                <MapPin size={12} />
                {r.name} <span style={{ color: '#b45309' }}>• F{r.floor} • {r.capacity}p</span>
                <ChevronRight size={12} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alternative Time Slots */}
      {alternativeSlots.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Clock size={13} style={{ marginRight: 4 }} />Free Time Slots for Same Room
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {alternativeSlots.map((s, i) => (
              <button key={i} onClick={() => onSlotSelect(s.startTime, s.endTime)} style={{
                padding: '0.4rem 0.85rem', borderRadius: 20, border: '1px solid #d97706',
                background: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.35rem',
                transition: 'all 0.15s'
              }}>
                <Zap size={12} />{s.startTime} – {s.endTime}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nearby Dates */}
      {nearbyDates.length > 0 && (
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Calendar size={13} style={{ marginRight: 4 }} />Same Room Available On
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {nearbyDates.map((d, i) => (
              <button key={i} onClick={() => onDateSelect(d.date)} style={{
                padding: '0.4rem 0.85rem', borderRadius: 20, border: '1px solid #d97706',
                background: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.35rem'
              }}>
                <Calendar size={12} />{d.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main Component ───────────────────────────────────────────── */
const BookRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [resources, setResources] = useState([]);

  // Form Fields
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [attendees, setAttendees] = useState(4);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [selectedResources, setSelectedResources] = useState({});

  // Availability & Suggestions
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [suggestions, setSuggestions] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const [checkingAvail, setCheckingAvail] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [createdBooking, setCreatedBooking] = useState(null);

  // Waiting list join state
  const [joiningWaiting, setJoiningWaiting] = useState(false);
  const [waitingSuccess, setWaitingSuccess] = useState('');

  const debounceRef = useRef(null);

  /* ── Load rooms & resources ─── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomsData, resourcesData] = await Promise.all([
          roomApi.getAllRooms(),
          resourceApi.getAllResources(),
        ]);
        setRooms(roomsData);
        setResources(resourcesData);

        if (location.state?.preselectedRoomId) {
          setSelectedRoomId(location.state.preselectedRoomId);
        } else if (roomsData.length > 0) {
          setSelectedRoomId(roomsData[0]._id);
        }
      } catch (err) {
        setErrorMsg('Error loading prerequisites: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location.state]);

  /* ── Debounced availability + suggestion fetch ─── */
  const fetchAvailabilityAndSuggestions = useCallback(async (roomId, d, st, et, att) => {
    if (!roomId || !d || !st || !et || st >= et) return;
    try {
      setCheckingAvail(true);
      const [availRes, suggestRes] = await Promise.all([
        roomApi.getRoomAvailability(roomId, d),
        roomApi.getSuggestions({ roomId, date: d, startTime: st, endTime: et, attendees: att }),
      ]);
      setAvailabilitySlots(availRes.data?.data || []);
      setSuggestions(suggestRes.data?.data || null);
      setConflictData(null); // Clear old conflict if slot changed
    } catch {
      // silently ignore – not critical
    } finally {
      setCheckingAvail(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchAvailabilityAndSuggestions(selectedRoomId, date, startTime, endTime, attendees);
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [selectedRoomId, date, startTime, endTime, attendees, fetchAvailabilityAndSuggestions]);

  const selectedRoom = rooms.find(r => r._id === selectedRoomId);
  const isTimeInvalid = startTime >= endTime;
  const isCapacityExceeded = selectedRoom && Number(attendees) > selectedRoom.capacity;

  /* ── Resource toggle ─── */
  const handleResourceToggle = (resId, isBroken) => {
    if (isBroken) return;
    setSelectedResources(prev => {
      const copy = { ...prev };
      if (copy[resId]) { delete copy[resId]; } else { copy[resId] = 1; }
      return copy;
    });
  };

  const handleQuantityChange = (resId, qty) => {
    setSelectedResources(prev => ({ ...prev, [resId]: Math.max(1, Number(qty)) }));
  };

  /* ── Submit booking ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg(''); setCreatedBooking(null); setConflictData(null); setSuggestions(null);

    if (!selectedRoomId) { setErrorMsg('Please select a meeting room.'); return; }
    if (isTimeInvalid) { setErrorMsg('Start time must be strictly before end time.'); return; }
    if (isCapacityExceeded) {
      setErrorMsg(`Attendees (${attendees}) exceeds room capacity (${selectedRoom.capacity}).`);
      return;
    }

    const resourcePayload = Object.entries(selectedResources).map(([resourceId, quantity]) => ({ resourceId, quantity }));
    const bookingPayload = {
      roomId: selectedRoomId, date, startTime, endTime,
      attendees: Number(attendees),
      title: meetingTitle.trim() || 'Team Meeting',
      resources: resourcePayload,
    };

    try {
      setSubmitting(true);
      const res = await bookingApi.createBooking(bookingPayload);
      setSuccessMsg('Meeting room booked successfully!');
      setCreatedBooking(res.data?.data);
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.message || err.message || 'Booking failed.';
      setErrorMsg(msg);

      // ── Conflict: show waiting list + suggestions ────────────────
      if (err.response?.status === 409 && data?.conflictSuggestWaitingList) {
        setConflictData(data.conflictDetails || { roomId: selectedRoomId, date, startTime, endTime, attendees });
        // Fetch/refresh suggestions now
        try {
          const suggestRes = await roomApi.getSuggestions({
            roomId: selectedRoomId, date, startTime, endTime, attendees
          });
          setSuggestions(suggestRes.data?.data || null);
        } catch { /* ignore */ }
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Auto-join waiting list ─── */
  const handleJoinWaitingList = async () => {
    const payload = conflictData || { roomId: selectedRoomId, date, startTime, endTime, attendees };
    try {
      setJoiningWaiting(true);
      setErrorMsg('');
      await waitingListApi.joinWaitingList({
        roomId: payload.roomId || selectedRoomId,
        date: payload.date || date,
        startTime: payload.startTime || startTime,
        endTime: payload.endTime || endTime,
        attendees: Number(payload.attendees || attendees),
        notes: meetingTitle.trim() || '',
      });
      setWaitingSuccess("You've been added to the waiting list! You'll get auto-assigned when the slot becomes free.");
      setConflictData(null);
      setSuggestions(null);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to join waiting list.');
    } finally {
      setJoiningWaiting(false);
    }
  };

  /* ── Suggestion quick-actions ─── */
  const handleSuggestionRoomSelect = (roomId) => {
    setSelectedRoomId(roomId);
    setSuggestions(null);
    setConflictData(null);
    setErrorMsg('');
  };

  const handleSuggestionSlotSelect = (st, et) => {
    setStartTime(st);
    setEndTime(et);
    setSuggestions(null);
    setConflictData(null);
    setErrorMsg('');
  };

  const handleSuggestionDateSelect = (d) => {
    setDate(d);
    setSuggestions(null);
    setConflictData(null);
    setErrorMsg('');
  };

  if (loading) return <LoadingSpinner text="Loading conference rooms and resources..." />;

  /* ── Render ─── */
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Reserve a Meeting Space</h1>
          <p>Schedule rooms, allocate equipment, and get smart suggestions when slots are taken.</p>
        </div>
      </div>

      {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}
      {waitingSuccess && <AlertBanner type="success" message={waitingSuccess} onClose={() => setWaitingSuccess('')} />}

      {/* ── Success State ── */}
      {createdBooking ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', backgroundColor: '#ecfdf5',
            color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
          }}>
            <CheckCircle size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Reservation Confirmed!
          </h2>
          <p style={{ color: '#475569', maxWidth: '480px', margin: '0 auto 0.5rem' }}>
            <strong>{createdBooking.title || 'Meeting'}</strong> in{' '}
            <strong>{selectedRoom?.name}</strong> on <strong>{date}</strong> ({startTime} – {endTime}).
          </p>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Remember to check in within 15 minutes of start time to avoid auto-cancellation.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/my-bookings')}>
              <span>View in My Bookings</span><ArrowRight size={16} />
            </button>
            <button className="btn btn-secondary" onClick={() => { setCreatedBooking(null); setSuccessMsg(''); }}>
              Book Another Room
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          <div className="card">
            <form onSubmit={handleSubmit}>

              {/* Meeting Title */}
              <div className="form-group">
                <label className="form-label">
                  Meeting Title / Purpose
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Q4 Strategy Review, Client Demo, Sprint Retrospective"
                  value={meetingTitle}
                  onChange={e => setMeetingTitle(e.target.value)}
                  maxLength={80}
                />
              </div>

              {/* Room Selection */}
              <div className="form-group">
                <label className="form-label">
                  Select Meeting Room <span className="required">*</span>
                </label>
                <select
                  className="form-control"
                  value={selectedRoomId}
                  onChange={e => setSelectedRoomId(e.target.value)}
                  required
                >
                  {rooms.map(room => (
                    <option key={room._id} value={room._id}>
                      {room.name} — Floor {room.floor} (Capacity: {room.capacity} people)
                    </option>
                  ))}
                </select>
                {selectedRoom && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem',
                    padding: '0.6rem 0.85rem', backgroundColor: '#f1f5f9',
                    borderRadius: 'var(--border-radius-md)', fontSize: '0.85rem',
                  }}>
                    <Users size={16} color="#2563eb" />
                    <span>Capacity: <strong>{selectedRoom.capacity} attendees</strong></span>
                    <span>•</span>
                    <span>Floor: <strong>{selectedRoom.floor}</strong></span>
                  </div>
                )}
              </div>

              {/* Date & Attendees */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Meeting Date <span className="required">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Attendees <span className="required">*</span></label>
                  <input
                    type="number" min="1" className="form-control"
                    value={attendees} onChange={e => setAttendees(e.target.value)} required
                  />
                  {isCapacityExceeded && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#dc2626', fontSize: '0.8rem', marginTop: '0.35rem', fontWeight: 600 }}>
                      <AlertTriangle size={14} /><span>Exceeds room capacity ({selectedRoom.capacity})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Time Slot */}
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

              {isTimeInvalid && (
                <div style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={16} /><span>End time must be later than start time.</span>
                </div>
              )}

              {/* Availability Timeline */}
              {selectedRoomId && (
                <div style={{ marginBottom: '1.5rem', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Info size={15} color="#2563eb" />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e40af' }}>
                      Room Availability
                    </span>
                    {checkingAvail && <RotateCw size={13} color="#64748b" className="animate-spin" />}
                  </div>
                  <AvailabilityTimeline slots={availabilitySlots} />
                </div>
              )}

              {/* Resources */}
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
                  Select Required Shared Resources <span style={{ fontWeight: 400, color: '#64748b' }}>(Optional)</span>
                </label>
                <p className="form-text" style={{ marginBottom: '1rem' }}>
                  Choose hardware equipment. Broken equipment is automatically disabled.
                </p>
                {resources.length === 0 ? (
                  <p className="text-muted" style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>No resources in database.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
                    {resources.map(res => {
                      const isBroken = res.status === 'broken';
                      const isSelected = !!selectedResources[res._id];
                      return (
                        <div key={res._id} onClick={() => handleResourceToggle(res._id, isBroken)} style={{
                          padding: '0.85rem 1rem', borderRadius: 'var(--border-radius-md)',
                          border: `1px solid ${isBroken ? '#fecaca' : isSelected ? 'var(--primary-600)' : 'var(--slate-200)'}`,
                          backgroundColor: isBroken ? '#fef2f2' : isSelected ? 'var(--primary-50)' : '#fff',
                          cursor: isBroken ? 'not-allowed' : 'pointer', transition: 'all 0.15s ease',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: isBroken ? 0.75 : 1,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <input type="checkbox" checked={isSelected} disabled={isBroken} onChange={() => {}}
                              style={{ cursor: isBroken ? 'not-allowed' : 'pointer' }} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>
                                {res.name} #{res.unitNumber}
                              </div>
                              <div style={{ fontSize: '0.75rem' }}>
                                {isBroken
                                  ? <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ Broken / Out of Order</span>
                                  : <span style={{ color: '#059669', fontWeight: 600 }}>✓ Available</span>}
                              </div>
                            </div>
                          </div>
                          {isSelected && !isBroken && (
                            <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontSize: '0.75rem', color: '#475569' }}>Qty:</span>
                              <input type="number" min="1" max="5" value={selectedResources[res._id]}
                                onChange={e => handleQuantityChange(res._id, e.target.value)}
                                style={{ width: '45px', padding: '0.2rem 0.4rem', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: '0.8rem', textAlign: 'center' }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-lg"
                  disabled={submitting || isTimeInvalid || isCapacityExceeded}>
                  <CalendarPlus size={20} />
                  <span>{submitting ? 'Verifying & Booking...' : 'Confirm Room Booking'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* ── Suggestions Panel (shown on conflict OR proactively) ── */}
          {(suggestions || conflictData) && (
            <SuggestionsPanel
              suggestions={suggestions || {}}
              conflictData={conflictData}
              onRoomSelect={handleSuggestionRoomSelect}
              onSlotSelect={handleSuggestionSlotSelect}
              onDateSelect={handleSuggestionDateSelect}
              onJoinWaiting={() => !joiningWaiting && handleJoinWaitingList()}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default BookRoom;
