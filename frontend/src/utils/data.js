export function getCollection(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export function formatDate(value) {
  if (!value) return "—";
  const dateValue = typeof value === "string" ? value.slice(0, 10) : new Date(value).toISOString().slice(0, 10);
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function bookingStart(booking) {
  const date = typeof booking.date === "string" ? booking.date.slice(0, 10) : new Date(booking.date).toISOString().slice(0, 10);
  return new Date(`${date}T${booking.startTime || "00:00"}:00`);
}

export function isSameDay(value) {
  if (!value) return false;
  const dateValue = typeof value === "string" ? value.slice(0, 10) : new Date(value).toISOString().slice(0, 10);
  const today = new Date();
  const todayValue = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
  return dateValue === todayValue;
}

export function isUpcoming(booking) {
  return bookingStart(booking).getTime() >= Date.now();
}

export function isCheckInAvailable(booking) {
  const startTime = bookingStart(booking).getTime();
  return Date.now() <= startTime + 15 * 60 * 1000;
}
