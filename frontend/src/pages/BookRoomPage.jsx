import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api.js";
import { ErrorMessage, Loading, PageHeader, SuccessMessage } from "../components/Feedback.jsx";
import { getCollection } from "../utils/data.js";

export default function BookRoomPage() {
  const [rooms, setRooms] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ roomId: "", date: "", startTime: "", endTime: "", attendees: "1" });
  const [selectedResources, setSelectedResources] = useState({});

  useEffect(() => {
    Promise.all([
      api.get("/room/rooms").catch((requestError) => {
        if (requestError.response?.status === 404 && requestError.response?.data?.message === "no rooms found") return { data: { data: [] } };
        throw requestError;
      }),
      api.get("/resource/getResource"),
    ])
      .then(([roomResponse, resourceResponse]) => {
        const roomList = getCollection(roomResponse.data);
        setRooms(roomList);
        setForm((current) => ({ ...current, roomId: roomList[0]?._id || "" }));
        setResources(getCollection(resourceResponse.data));
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function toggleResource(id) {
    setSelectedResources((current) => {
      const next = { ...current };
      if (next[id]) delete next[id];
      else next[id] = 1;
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const response = await api.post("/booking/create", {
        roomId: form.roomId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        attendees: Number(form.attendees),
        resources: Object.entries(selectedResources).map(([resourceId, quantity]) => ({ resourceId, quantity })),
      });
      setSuccess(response.data?.message || "Booking created.");
      setSelectedResources({});
      setForm((current) => ({ ...current, date: "", startTime: "", endTime: "", attendees: "1" }));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading label="Loading rooms and resources..." />;
  return (
    <>
      <PageHeader title="Book a room" description="Choose a room, time, attendee count, and any available equipment." />
      <section className="panel form-panel">
        <form className="form-stack" onSubmit={handleSubmit}>
          <ErrorMessage>{error}</ErrorMessage><SuccessMessage>{success}</SuccessMessage>
          {rooms.length === 0 ? <p className="alert alert-error">No rooms are currently available in the room list.</p> : <>
            <label>Room<select name="roomId" value={form.roomId} onChange={updateField} required><option value="" disabled>Select a room</option>{rooms.map((room) => <option key={room._id} value={room._id}>{room.name} · {room.capacity} people · Floor {room.floor}</option>)}</select></label>
            <div className="form-grid">
              <label>Date<input type="date" name="date" value={form.date} onChange={updateField} min={new Date().toISOString().slice(0, 10)} required /></label>
              <label>Attendees<input type="number" name="attendees" min="1" value={form.attendees} onChange={updateField} required /></label>
              <label>Start time<input type="time" name="startTime" value={form.startTime} onChange={updateField} required /></label>
              <label>End time<input type="time" name="endTime" value={form.endTime} onChange={updateField} required /></label>
            </div>
            <fieldset className="resource-picker"><legend>Required resources</legend>
              {resources.filter((resource) => resource.status === "available").length === 0 ? <p className="muted">No resources are currently marked available.</p> : resources.filter((resource) => resource.status === "available").map((resource) => (
                <label className="check-row" key={resource._id}><input type="checkbox" checked={Boolean(selectedResources[resource._id])} onChange={() => toggleResource(resource._id)} /><span>{resource.name} · Unit {resource.unitNumber}</span><input aria-label={`${resource.name} quantity`} className="quantity-input" type="number" min="1" value={selectedResources[resource._id] || 1} disabled={!selectedResources[resource._id]} onChange={(event) => setSelectedResources((current) => ({ ...current, [resource._id]: Number(event.target.value) }))} /></label>
              ))}
            </fieldset>
            <p className="muted small-copy">The backend validates attendee capacity, time conflicts, and resource status. Attendee count is not stored with the booking.</p>
            <button className="button button-primary" type="submit" disabled={submitting || !form.roomId}>{submitting ? "Submitting..." : "Create booking"}</button>
          </>}
        </form>
      </section>
    </>
  );
}
