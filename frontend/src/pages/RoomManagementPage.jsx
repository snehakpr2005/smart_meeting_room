import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api.js";
import { EmptyState, ErrorMessage, Loading, PageHeader, SuccessMessage } from "../components/Feedback.jsx";
import { getCollection } from "../utils/data.js";

const emptyForm = { name: "", capacity: "", floor: "" };

export default function RoomManagementPage() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadRooms() {
    const response = await api.get("/room/rooms");
    setRooms(getCollection(response.data));
  }

  useEffect(() => {
    loadRooms().catch((requestError) => {
      if (requestError.response?.status === 404 && requestError.response?.data?.message === "no rooms found") setRooms([]);
      else setError(getErrorMessage(requestError));
    }).finally(() => setLoading(false));
  }, []);

  function editRoom(room) {
    setEditingId(room._id);
    setForm({ name: room.name, capacity: String(room.capacity), floor: String(room.floor) });
    setError(""); setSuccess("");
  }

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    const body = { name: form.name.trim(), capacity: Number(form.capacity), floor: Number(form.floor) };
    try {
      const response = editingId
        ? await api.put(`/room/room/${editingId}`, body)
        : await api.post("/room/create", body);
      setSuccess(response.data?.message || (editingId ? "Room updated." : "Room created."));
      setEditingId(""); setForm(emptyForm);
      await loadRooms();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setSaving(false); }
  }

  async function deleteRoom(id) {
    if (!window.confirm("Delete this room?")) return;
    setError(""); setSuccess("");
    try {
      const response = await api.delete(`/room/room/${id}`);
      setSuccess(response.data?.message || "Room deleted.");
      await loadRooms();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  }

  return (
    <>
      <PageHeader title="Manage rooms" description="Add, update, or remove meeting rooms." />
      <ErrorMessage>{error}</ErrorMessage><SuccessMessage>{success}</SuccessMessage>
      <section className="panel compact-panel"><h2>{editingId ? "Update room" : "Add room"}</h2><form className="inline-form room-form" onSubmit={submit}>
        <label>Room name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Capacity<input type="number" min="1" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} required /></label>
        <label>Floor<input type="number" min="0" value={form.floor} onChange={(event) => setForm({ ...form, floor: event.target.value })} required /></label>
        <button className="button button-primary" disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Add room"}</button>
        {editingId && <button type="button" className="button button-secondary" onClick={() => { setEditingId(""); setForm(emptyForm); }}>Cancel</button>}
      </form></section>
      {loading ? <Loading /> : rooms.length === 0 ? <EmptyState>No rooms found.</EmptyState> : (
        <section className="panel table-wrap"><table><thead><tr><th>Room</th><th>Capacity</th><th>Floor</th><th>Actions</th></tr></thead><tbody>
          {rooms.map((room) => <tr key={room._id}><td>{room.name}</td><td>{room.capacity}</td><td>{room.floor}</td><td><div className="action-row"><button className="button button-small button-secondary" onClick={() => editRoom(room)}>Edit</button><button className="button button-small button-danger-quiet" onClick={() => deleteRoom(room._id)}>Delete</button></div></td></tr>)}
        </tbody></table></section>
      )}
    </>
  );
}
