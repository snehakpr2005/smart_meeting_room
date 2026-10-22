import { useState } from "react";
import api, { getErrorMessage } from "../services/api.js";
import { ErrorMessage, PageHeader, SuccessMessage } from "../components/Feedback.jsx";

export default function UserManagementPage() {
  const [form, setForm] = useState({ department: "IT", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault(); setError(""); setSuccess(""); setSaving(true);
    try {
      const response = await api.post("/user/auth/createfacilitymanager", form);
      setSuccess(response.data?.message || "Facility manager account created.");
      setForm({ department: "IT", email: "", password: "" });
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setSaving(false); }
  }

  return (
    <>
      <PageHeader title="Users" description="User listing and general user management are not available in the backend." />
      <section className="panel form-panel">
        <h2>Create a facility manager</h2>
        <p className="muted">This action is supported for admin accounts. The backend does not provide a user-list endpoint.</p>
        <form className="form-stack" onSubmit={submit}>
          <ErrorMessage>{error}</ErrorMessage><SuccessMessage>{success}</SuccessMessage>
          <label>Department<select value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })}><option>IT</option><option>Management</option><option>Travel Agency</option></select></label>
          <label>Email address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
          <label>Temporary password<input type="password" minLength="1" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label>
          <button className="button button-primary" disabled={saving}>{saving ? "Creating..." : "Create facility manager"}</button>
        </form>
      </section>
    </>
  );
}
