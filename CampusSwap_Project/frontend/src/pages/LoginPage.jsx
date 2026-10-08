import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login({ email, password });
      navigate("/browse");
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
        <h1>Welcome back</h1>
        <form onSubmit={submit} noValidate>
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@campus.edu"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          {error && <small className="field-error">{error}</small>}
          <button className="primary-btn big" type="submit" disabled={busy}>
            {busy ? "Logging in…" : "Log in →"}
          </button>
        </form>
        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
        <div className="demo-hint">
          <b>Demo account</b>
          <span>ananya@campus.edu / campus123</span>
        </div>
      </div>
    </section>
  );
}
