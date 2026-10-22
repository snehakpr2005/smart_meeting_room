import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ErrorMessage } from "../components/Feedback.jsx";
import { getErrorMessage } from "../services/api.js";

export default function LoginPage() {
  const { session, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (session) return <Navigate to={session.role === "employee" ? "/dashboard" : "/admin"} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter both your email and password.");
      return;
    }
    setLoading(true);
    try {
      const role = await login(email.trim(), password);
      const destination = role === "employee" ? "/dashboard" : "/admin";
      navigate(location.state?.from?.pathname || destination, { replace: true });
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand login-brand">
          <span className="brand-mark">SM</span>
          <div><strong>Smart Meeting</strong><small>Room & Resources</small></div>
        </div>
        <div className="login-intro">
          <p className="eyebrow">MEETING SPACE, MADE SIMPLE</p>
          <h1>Welcome back</h1>
          <p>Sign in to manage your rooms and bookings.</p>
        </div>
        <form onSubmit={handleSubmit} className="form-stack">
          <ErrorMessage>{error}</ErrorMessage>
          <label>Email address<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<div className="password-input"><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></div></label>
          <button className="button button-primary button-full" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
        </form>
        <p className="login-footnote">Use the account provided by your administrator.</p>
      </section>
    </main>
  );
}
