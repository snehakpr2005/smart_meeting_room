import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../services/api.js";
import { ErrorMessage, Loading, PageHeader } from "../components/Feedback.jsx";
import { getCollection } from "../utils/data.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function RoomsPage() {
  const { session } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [minimumCapacity, setMinimumCapacity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [empty, setEmpty] = useState(false);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError("");
    setEmpty(false);
    try {
      const response = await api.get("/room/rooms");
      const roomList = getCollection(response.data);
      setRooms(roomList);
      setEmpty(roomList.length === 0);
    } catch (requestError) {
      if (requestError.response?.status === 404 && requestError.response?.data?.message === "no rooms found") {
        setRooms([]);
        setEmpty(true);
      } else {
        setRooms([]);
        setError(getErrorMessage(requestError));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const filteredRooms = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const capacityLimit = minimumCapacity === "" ? 0 : Number(minimumCapacity);
    return rooms.filter((room) => (
      room.name?.toLocaleLowerCase().includes(normalizedSearch) &&
      Number(room.capacity) >= capacityLimit
    ));
  }, [rooms, search, minimumCapacity]);

  const isAdmin = session.role === "admin";

  return (
    <>
      <PageHeader
        title="Meeting rooms"
        description="Find the right space for your next meeting."
        action={<button className="button button-secondary" type="button" onClick={loadRooms} disabled={loading}>{loading ? "Refreshing..." : "Refresh rooms"}</button>}
      />

      <ErrorMessage>{error}</ErrorMessage>
      {error && <div className="rooms-error-actions"><button className="button button-secondary" onClick={loadRooms} disabled={loading}>Try again</button><span className="muted small-copy">Check that you are signed in and the backend is running.</span></div>}

      {!loading && !error && rooms.length > 0 && (
        <section className="rooms-toolbar panel" aria-label="Room filters">
          <label className="room-search">Search rooms<input type="search" placeholder="Search by room name" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <label className="capacity-filter">Minimum capacity<select value={minimumCapacity} onChange={(event) => setMinimumCapacity(event.target.value)}><option value="">Any capacity</option><option value="4">4+ people</option><option value="8">8+ people</option><option value="12">12+ people</option><option value="20">20+ people</option></select></label>
          <p className="room-count">{filteredRooms.length} of {rooms.length} {rooms.length === 1 ? "room" : "rooms"}</p>
        </section>
      )}

      {loading ? <Loading label="Loading rooms from the backend..." /> : error ? null : empty ? (
        <section className="rooms-empty panel">
          <div className="rooms-empty-icon" aria-hidden="true">R</div>
          <p className="eyebrow">ROOM DIRECTORY</p>
          <h2>No rooms have been added yet</h2>
          <p>The database currently has no room records. Once an administrator adds rooms, they will appear here.</p>
          <div className="rooms-empty-actions">
            {isAdmin && <Link className="button button-primary" to="/admin/rooms">Add the first room</Link>}
            <button className="button button-secondary" onClick={loadRooms}>Refresh</button>
          </div>
        </section>
      ) : filteredRooms.length === 0 ? (
        <section className="rooms-empty panel">
          <h2>No rooms match those filters</h2>
          <p>Try another room name or lower the minimum capacity.</p>
          <button className="button button-secondary" onClick={() => { setSearch(""); setMinimumCapacity(""); }}>Clear filters</button>
        </section>
      ) : (
        <section className="rooms-results">
          <div className="rooms-results-heading"><h2>Available spaces</h2><p>Room availability for a selected time is not provided by this backend.</p></div>
          <div className="card-grid rooms-grid">
            {filteredRooms.map((room) => (
              <article className="panel room-card room-card-enhanced" key={room._id}>
                <div className="room-card-top"><div className="room-icon" aria-hidden="true">R</div><span className="status-badge">Room</span></div>
                <div className="room-card-title"><h2>{room.name}</h2><p>Floor {room.floor}</p></div>
                <div className="room-meta"><span>Seating capacity</span><strong>{room.capacity} people</strong></div>
                <p className="muted small-copy">Live availability and assigned equipment are not provided by the backend.</p>
                <div className="room-card-actions">
                  <Link to={`/rooms/${room._id}`} className="button button-secondary">Details</Link>
                  <Link to={`/book?roomId=${encodeURIComponent(room._id)}`} className="button button-primary">Book this room</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
