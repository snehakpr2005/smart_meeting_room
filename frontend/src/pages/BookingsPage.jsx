import { useCallback, useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api.js";
import { EmptyState, ErrorMessage, Loading, PageHeader, SuccessMessage } from "../components/Feedback.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatDate, getCollection, isCheckInAvailable } from "../utils/data.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function BookingsPage() {
  const { session } = useAuth();
  const management = session.role !== "employee";
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadBookings = useCallback(async () => {
    setError("");
    try {
      const response = await api.get("/booking/");
      setBookings(getCollection(response.data));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  async function updateBooking(id, action) {
    setError("");
    setSuccess("");
    setBusyId(id);
    try {
      const path = action === "checkin" ? `/booking/checkedin/${id}` : `/booking/cancel/${id}`;
      const response = await api.put(path);
      setSuccess(response.data?.message || `Booking ${action === "checkin" ? "checked in" : "cancelled"}.`);
      await loadBookings();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyId("");
    }
  }

  const title = management ? "Bookings" : "My bookings";
  return (
    <>
      <PageHeader title={title} description={management ? "Bookings visible to your management role." : "Review and manage your own room bookings."} />
      <ErrorMessage>{error}</ErrorMessage><SuccessMessage>{success}</SuccessMessage>
      {loading ? <Loading /> : bookings.length === 0 ? <EmptyState>No bookings found.</EmptyState> : (
        <section className="panel table-wrap"><table><thead><tr><th>Room</th>{management && <th>Booked by</th>}<th>Date</th><th>Time</th><th>Resources</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{bookings.map((booking) => {
            const resourceSummary = (booking.resources || []).map((entry) => {
              const item = entry.resourceId;
              return item && typeof item === "object" ? `${item.name} × ${entry.quantity}` : "";
            }).filter(Boolean).join(", ");
            return <tr key={booking._id}>
              <td>{booking.roomId?.name || "Room"}</td>
              {management && <td>{booking.userId?.email || "User"}</td>}
              <td>{formatDate(booking.date)}</td><td>{booking.startTime}–{booking.endTime}</td><td>{resourceSummary || "None"}</td>
              <td><StatusBadge status={booking.status} />{booking.checkedIn && <small className="table-note">Checked in</small>}</td>
              <td><div className="action-row">
                {!management && booking.status === "confirmed" && !booking.checkedIn && isCheckInAvailable(booking) && <button className="button button-small button-secondary" disabled={busyId === booking._id} onClick={() => updateBooking(booking._id, "checkin")}>Check in</button>}
                {booking.status === "confirmed" && <button className="button button-small button-danger-quiet" disabled={busyId === booking._id} onClick={() => updateBooking(booking._id, "cancel")}>Cancel</button>}
              </div></td>
            </tr>;
          })}</tbody>
        </table></section>
      )}
    </>
  );
}
