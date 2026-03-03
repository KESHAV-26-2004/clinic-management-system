// client/src/pages/Setup.jsx
import { useState, useEffect } from "react";
import api from "../api/apiClient";
import "../styles/auth.css";

export default function Setup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "");
  }, []);

  useEffect(() => {
    api.get("/setup/status").then((res) => {
      if (!res.data.setupRequired) {
        window.location.href = "/login";
      } else {
        setReady(true);
      }
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setSaving(true);
      await api.post("/setup", { username, password });
      alert("Admin created successfully. Please login.");
      window.location.href = "/login";
    } catch (err) {
      setError(err.response?.data?.error || "Setup failed");
    } finally {
      setSaving(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1 className="auth-title">Clinic Setup</h1>
        <p className="auth-subtitle">
          Create the administrator account to start using the system
        </p>

        <div className="auth-field">
          <input
            type="text"
            placeholder="Admin username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="auth-field password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="button"
            className="password-eye"
            onClick={() => setShowPassword(!showPassword)}
            aria-label="Toggle password visibility"
          >
            {showPassword ? (
              /* eye-off */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 3l18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M10.58 10.58A3 3 0 0012 15a3 3 0 002.42-4.42"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            ) : (
              /* eye */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            )}
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button className="auth-btn" type="submit" disabled={saving}>
          {saving ? "Creating…" : "Create Admin"}
        </button>
      </form>
    </div>
  );
}