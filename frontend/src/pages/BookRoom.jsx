import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { roomApi, resourceApi, bookingApi } from '../api/axiosClient';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import {
  CalendarPlus,
  DoorOpen,
  Calendar,
  Clock,
  Users,
  Tv,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

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
  const [selectedResources, setSelectedResources] = useState({}); // { [resourceId]: quantity }

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [createdBooking, setCreatedBooking] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const [roomsData, resourcesData] = await Promise.all([
          roomApi.getAllRooms(),
          resourceApi.getAllResources(),
        ]);

        setRooms(roomsData);
        setResources(resourcesData);

        // Preselect room if passed via state
        if (location.state?.preselectedRoomId) {
          setSelectedRoomId(location.state.preselectedRoomId);
        } else if (roomsData.length > 0) {
          setSelectedRoomId(roomsData[0]._id);
        }
      } catch (err) {
        setErrorMsg('Error loading booking prerequisites: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.state]);

  const selectedRoom = rooms.find((r) => r._id === selectedRoomId);

  // Toggle resource inclusion
  const handleResourceToggle = (resId, isBroken) => {
    if (isBroken) return; // Cannot select broken resource
    setSelectedResources((prev) => {
      const copy = { ...prev };
      if (copy[resId]) {
        delete copy[resId];
      } else {
        copy[resId] = 1;
      }
      return copy;
    });
  };

  const handleQuantityChange = (resId, qty) => {
    setSelectedResources((prev) => ({
      ...prev,
      [resId]: Math.max(1, Number(qty)),
    }));
  };

  // Client-side validations
  const isTimeInvalid = startTime >= endTime;
  const isCapacityExceeded = selectedRoom && Number(attendees) > selectedRoom.capacity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setCreatedBooking(null);

    if (!selectedRoomId) {
      setErrorMsg('Please select a meeting room.');
      return;
    }

    if (isTimeInvalid) {
      setErrorMsg('Start time must be strictly before end time.');
      return;
    }

    if (isCapacityExceeded) {
      setErrorMsg(
        `Number of attendees (${attendees}) exceeds room capacity (${selectedRoom.capacity} seats).`
      );
      return;
    }

    // Build payload matching backend expected format:
    // { roomId, date, startTime, endTime, attendees, resources: [{ resourceId, quantity }] }
    const resourcePayload = Object.entries(selectedResources).map(([resourceId, quantity]) => ({
      resourceId,
      quantity,
    }));

    const bookingPayload = {
      roomId: selectedRoomId,
      date,
      startTime,
      endTime,
      attendees: Number(attendees),
      resources: resourcePayload,
    };

    try {
      setSubmitting(true);
      const res = await bookingApi.createBooking(bookingPayload);
      setSuccessMsg('Meeting room and resources booked successfully!');
      setCreatedBooking(res.data?.data);
    } catch (err) {
      // Backend error (e.g. 409 conflict, room already booked, broken resource)
      const message =
        err.response?.data?.message || err.message || 'Booking failed. Please resolve time conflicts.';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading conference rooms and available resources..." />;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Reserve a Meeting Space</h1>
          <p>
            Schedule rooms, allocate presentation hardware, and invite colleagues with automatic conflict
            prevention.
          </p>
        </div>
      </div>

      {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {createdBooking ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <CheckCircle size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Reservation Confirmed!
          </h2>
          <p style={{ color: '#475569', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            Your booking for <strong>{selectedRoom?.name}</strong> on <strong>{date}</strong> (
            {startTime} – {endTime}) has been placed. Remember to check in within 15 minutes of start time.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/my-bookings')}>
              <span>View in My Bookings</span>
              <ArrowRight size={16} />
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setCreatedBooking(null);
                setSuccessMsg('');
              }}
            >
              Book Another Room
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Select Room */}
            <div className="form-group">
              <label className="form-label">
                Select Meeting Room <span className="required">*</span>
              </label>
              <select
                className="form-control"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                required
              >
                {rooms.map((room) => (
                  <option key={room._id} value={room._id}>
                    {room.name} — Floor {room.floor} (Capacity: {room.capacity} people)
                  </option>
                ))}
              </select>
              {selectedRoom && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginTop: '0.5rem',
                    padding: '0.6rem 0.85rem',
                    backgroundColor: '#f1f5f9',
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: '0.85rem',
                  }}
                >
                  <Users size={16} color="#2563eb" />
                  <span>
                    Maximum Capacity: <strong>{selectedRoom.capacity} attendees</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Floor Location: <strong>Floor {selectedRoom.floor}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Step 2: Date and Attendees */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Meeting Date <span className="required">*</span>
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
                <label className="form-label">
                  Estimated Attendees <span className="required">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  required
                />
                {isCapacityExceeded && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: '#dc2626',
                      fontSize: '0.8rem',
                      marginTop: '0.35rem',
                      fontWeight: 600,
                    }}
                  >
                    <AlertTriangle size={14} />
                    <span>Warning: Exceeds room capacity ({selectedRoom.capacity})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Time Slot */}
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

            {isTimeInvalid && (
              <div
                style={{
                  color: '#dc2626',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <AlertTriangle size={16} />
                <span>End time must be later than start time.</span>
              </div>
            )}

            {/* Step 4: Required Resource Selection */}
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
                Select Required Shared Resources (Optional)
              </label>
              <p className="form-text" style={{ marginBottom: '1rem' }}>
                Choose hardware equipment needed for this meeting. Broken equipment is automatically disabled.
              </p>

              {resources.length === 0 ? (
                <p className="text-muted" style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
                  No resources registered in the database.
                </p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '0.85rem',
                  }}
                >
                  {resources.map((res) => {
                    const isBroken = res.status === 'broken';
                    const isSelected = !!selectedResources[res._id];

                    return (
                      <div
                        key={res._id}
                        onClick={() => handleResourceToggle(res._id, isBroken)}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--border-radius-md)',
                          border: `1px solid ${
                            isBroken
                              ? '#fecaca'
                              : isSelected
                              ? 'var(--primary-600)'
                              : 'var(--slate-200)'
                          }`,
                          backgroundColor: isBroken
                            ? '#fef2f2'
                            : isSelected
                            ? 'var(--primary-50)'
                            : '#ffffff',
                          cursor: isBroken ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          opacity: isBroken ? 0.75 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isBroken}
                            onChange={() => {}} // Controlled by container onClick
                            style={{ cursor: isBroken ? 'not-allowed' : 'pointer' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>
                              {res.name} #{res.unitNumber}
                            </div>
                            <div style={{ fontSize: '0.75rem' }}>
                              {isBroken ? (
                                <span style={{ color: '#dc2626', fontWeight: 600 }}>
                                  ⚠️ Broken / Out of Order
                                </span>
                              ) : (
                                <span style={{ color: '#059669', fontWeight: 600 }}>
                                  ✓ Available
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {isSelected && !isBroken && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <span style={{ fontSize: '0.75rem', color: '#475569' }}>Qty:</span>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={selectedResources[res._id]}
                              onChange={(e) => handleQuantityChange(res._id, e.target.value)}
                              style={{
                                width: '45px',
                                padding: '0.2rem 0.4rem',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.8rem',
                                textAlign: 'center',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/dashboard')}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={submitting || isTimeInvalid || isCapacityExceeded}
              >
                <CalendarPlus size={20} />
                <span>{submitting ? 'Verifying & Booking...' : 'Confirm Room Booking'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BookRoom;
