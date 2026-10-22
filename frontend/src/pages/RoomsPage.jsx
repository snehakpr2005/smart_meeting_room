import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../services/api.js";
import { EmptyState, ErrorMessage, Loading, PageHeader } from "../components/Feedback.jsx";
import { getCollection } from "../utils/data.js";

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/room/rooms")
      .then((response) => setRooms(getCollection(response.data)))
      .catch((requestError) => {
        if (requestError.response?.status === 404 && requestError.response?.data?.message === "no rooms found") setRooms([]);
        else setError(getErrorMessage(requestError));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Rooms" description="Browse meeting spaces and their capacity." />
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? <Loading /> : rooms.length === 0 ? <EmptyState>No rooms have been added yet.</EmptyState> : (
        <div className="card-grid">{rooms.map((room) => (
          <article className="panel room-card" key={room._id}>
            <div className="room-icon">R</div>
            <div><h2>{room.name}</h2><p>Floor {room.floor}</p></div>
            <div className="room-meta"><span>Capacity</span><strong>{room.capacity} people</strong></div>
            <p className="muted small-copy">Live availability is not exposed by the backend.</p>
            <Link to={`/rooms/${room._id}`} className="button button-secondary button-full">View details</Link>
          </article>
        ))}</div>
      )}
    </>
  );
}
