import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", campus: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register(form);
      navigate("/sell");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <Link className="brand center" to="/">
          <span className="brand-mark">CS</span> CampusSwap
        </Link>
        <h1>Join your campus marketplace</h1>
        <form onSubmit={submit} noValidate>
          <label>
            Full name
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Your name"
            />
          </label>
          <label>
            Campus
            <input
              required
              value={form.campus}
              onChange={(e) => update("campus", e.target.value)}
              placeholder="Your college / university"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@campus.edu"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="At least 6 characters"
            />
          </label>
          {error && <small className="field-error">{error}</small>}
          <button className="primary-btn big" type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create account →"}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  );
}
