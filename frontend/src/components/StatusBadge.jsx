export default function StatusBadge({ status }) {
  const normalized = String(status || "unknown").toLowerCase();
  return <span className={`status-badge status-${normalized.replace(/\s+/g, "-")}`}>{status || "Unknown"}</span>;
}
