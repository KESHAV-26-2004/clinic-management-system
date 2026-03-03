// client/src/auth/ChangePassword.jsx
import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { Navigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import api from "../api/apiClient";
import "../styles/auth.css";

export default function ChangePassword() {
  const { user, loading, logout } = useAuth();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "");
  }, []);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.mustChangePassword) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (next !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      setSaving(true);
      await api.post("/auth/change-password", { newPassword: next });
      alert("Password changed successfully. Please login again.");
      logout();
    } catch (err) {
      setError(err.response?.data?.error || "Password change failed");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key) =>
    setShow((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1 className="auth-title">Change Password</h1>
        <p className="auth-subtitle">
          For security reasons, you must update your password
        </p>

        {[
          ["current", current, setCurrent, "Current password"],
          ["next", next, setNext, "New password"],
          ["confirm", confirm, setConfirm, "Confirm new password"],
        ].map(([key, value, setter, placeholder]) => (
          <div className="auth-field password-field" key={key}>
            <input
              type={show[key] ? "text" : "password"}
              placeholder={placeholder}
              value={value}
              onChange={(e) => setter(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-eye"
              onClick={() => toggle(key)}
              aria-label="Toggle password visibility"
            >
              {show[key] ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
        ))}

        {error && <div className="auth-error">{error}</div>}

        <button className="auth-btn" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Change Password"}
        </button>
      </form>
    </div>
  );
}