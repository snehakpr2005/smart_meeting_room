import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api.js";
import { EmptyState, ErrorMessage, Loading, PageHeader, SuccessMessage } from "../components/Feedback.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { getCollection } from "../utils/data.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function ResourcesPage() {
  const { session } = useAuth();
  const canUpdate = session.role === "admin" || session.role === "facility_manager";
  const canCreateDelete = session.role === "admin";
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name: "", unitNumber: "" });
  const [saving, setSaving] = useState(false);

  async function loadResources() {
    const response = await api.get("/resource/getResource");
    setResources(getCollection(response.data));
  }

  useEffect(() => {
    loadResources().catch((requestError) => setError(getErrorMessage(requestError))).finally(() => setLoading(false));
  }, []);

  async function changeStatus(resource) {
    setError(""); setSuccess("");
    try {
      const status = resource.status === "available" ? "broken" : "available";
      const response = await api.put(`/resource/update/${resource._id}`, { status });
      setSuccess(response.data?.message || `Resource marked ${status}.`);
      await loadResources();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  }

  async function createResource(event) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      const response = await api.post("/resource/createResource", { name: form.name.trim(), unitNumber: Number(form.unitNumber) });
      setSuccess(response.data?.message || "Resource created.");
      setForm({ name: "", unitNumber: "" });
      await loadResources();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setSaving(false); }
  }

  async function deleteResource(id) {
    if (!window.confirm("Delete this resource?")) return;
    setError(""); setSuccess("");
    try {
      const response = await api.put(`/resource/delete/${id}`);
      setSuccess(response.data?.message || "Resource deleted.");
      await loadResources();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  }

  return (
    <>
      <PageHeader title={canUpdate ? "Manage resources" : "Resources"} description="Resource inventory and current condition." />
      <ErrorMessage>{error}</ErrorMessage><SuccessMessage>{success}</SuccessMessage>
      {canCreateDelete && <section className="panel compact-panel"><h2>Add resource</h2><form className="inline-form" onSubmit={createResource}><label>Resource name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Unit number<input type="number" min="1" value={form.unitNumber} onChange={(event) => setForm({ ...form, unitNumber: event.target.value })} required /></label><button className="button button-primary" disabled={saving}>{saving ? "Saving..." : "Add resource"}</button></form></section>}
      {loading ? <Loading /> : resources.length === 0 ? <EmptyState>No resources found.</EmptyState> : (
        <section className="panel table-wrap"><table><thead><tr><th>Resource</th><th>Unit</th><th>Status</th>{canUpdate && <th>Actions</th>}</tr></thead><tbody>
          {resources.map((resource) => <tr key={resource._id}><td>{resource.name}</td><td>{resource.unitNumber}</td><td><StatusBadge status={resource.status} /></td>{canUpdate && <td><div className="action-row"><button className="button button-small button-secondary" onClick={() => changeStatus(resource)}>Mark {resource.status === "available" ? "broken" : "available"}</button>{canCreateDelete && <button className="button button-small button-danger-quiet" onClick={() => deleteResource(resource._id)}>Delete</button>}</div></td>}</tr>)}
        </tbody></table></section>
      )}
    </>
  );
}
