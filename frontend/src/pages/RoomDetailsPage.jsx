import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../services/api.js";
import { ErrorMessage, Loading, PageHeader } from "../components/Feedback.jsx";

export default function RoomDetailsPage() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/room/room/${id}`)
      .then((response) => setRoom(response.data?.data))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  return (
    <>
      <PageHeader title={room?.name || "Room details"} description="Room information returned by the backend." />
      <ErrorMessage>{error}</ErrorMessage>
      {room && <section className="panel detail-panel"><dl className="detail-list"><div><dt>Capacity</dt><dd>{room.capacity} people</dd></div><div><dt>Floor</dt><dd>{room.floor}</dd></div><div><dt>Availability</dt><dd>Not provided by the backend</dd></div><div><dt>Assigned resources</dt><dd>Not provided by the backend</dd></div></dl><Link className="button button-primary" to={`/book?roomId=${encodeURIComponent(room._id)}`}>Book this room</Link></section>}
    </>
  );
}
