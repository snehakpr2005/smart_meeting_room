import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../services/api.js";
import { EmptyState, ErrorMessage, Loading, PageHeader } from "../components/Feedback.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatDate, getCollection, isSameDay, isUpcoming } from "../utils/data.js";
import { useAuth } from "../context/AuthContext.jsx";

function StatCard({ label, value, note }) {
  return <article className="stat-card"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</article>;
}

export default function DashboardPage() {
  const { session } = useAuth();
  const [data, setData] = useState({ rooms: [], resources: [], bookings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [roomResponse, resourceResponse, bookingResponse] = await Promise.all([
          api.get("/room/rooms").catch((requestError) => {
            if (requestError.response?.status === 404 && requestError.response?.data?.message === "no rooms found") return { data: { data: [] } };
            throw requestError;
          }),
          api.get("/resource/getResource"),
          api.get("/booking/"),
        ]);
        setData({
          rooms: getCollection(roomResponse.data),
          resources: getCollection(resourceResponse.data),
          bookings: getCollection(bookingResponse.data),
        });
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const today = data.bookings.filter((booking) => isSameDay(booking.date));
  const upcoming = data.bookings.filter((booking) => isUpcoming(booking) && booking.status === "confirmed").slice(0, 5);
  const availableResources = data.resources.filter((resource) => resource.status === "available").length;
  const manager = session.role !== "employee";

  if (loading) return <Loading label="Loading your workspace..." />;

  return (
    <>
      <PageHeader title={manager ? "Management overview" : "Good to see you"} description={manager ? "A current view of rooms, resources, and bookings." : "Your meeting room workspace at a glance."} />
      <ErrorMessage>{error}</ErrorMessage>
      <section className="stat-grid">
        <StatCard label={manager ? "Total rooms" : "Rooms listed"} value={data.rooms.length} note="Live availability is not provided by the API" />
        <StatCard label={manager ? "Total resources" : "Available resources"} value={manager ? data.resources.length : availableResources} />
        <StatCard label={manager ? "Active bookings" : "Today's bookings"} value={manager ? data.bookings.filter((item) => item.status === "confirmed").length : today.length} />
        {manager && <StatCard label="Total users" value="Not available" note="No user-list API exists" />}
        {manager && <StatCard label="Waiting-list requests" value="Not available" note="No waiting-list API exists" />}
      </section>
      <section className="panel section-panel">
        <div className="section-title-row"><div><h2>{manager ? "Current bookings" : "Upcoming bookings"}</h2><p>Bookings visible to your account</p></div><Link className="text-link" to="/bookings">View bookings</Link></div>
        {upcoming.length === 0 ? <EmptyState>No upcoming confirmed bookings.</EmptyState> : (
          <div className="table-wrap"><table><thead><tr><th>Room</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>{upcoming.map((booking) => <tr key={booking._id}><td>{booking.roomId?.name || "Room"}</td><td>{formatDate(booking.date)}</td><td>{booking.startTime}–{booking.endTime}</td><td><StatusBadge status={booking.status} /></td></tr>)}</tbody>
          </table></div>
        )}
      </section>
      <div className="quick-links"><Link className="button button-primary" to="/book">Book a room</Link><Link className="button button-secondary" to="/rooms">Browse rooms</Link></div>
    </>
  );
}
