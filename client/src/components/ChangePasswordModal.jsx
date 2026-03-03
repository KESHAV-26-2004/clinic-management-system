import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import api from "../api/apiClient";

export default function ChangePasswordModal({ open, onClose }) {
  if (!open) return null;

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const toggle = (key) =>
    setShow((s) => ({ ...s, [key]: !s[key] }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (next !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      setSaving(true);

      await api.post("/auth/change-password", {
        currentPassword: current,
        newPassword: next,
      });

      alert("Password updated successfully");
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="confirm-overlay">
      <form className="password-modal-card" onSubmit={submit}>
        <h3>Change Password</h3>

        {[
          ["current", current, setCurrent, "Current password"],
          ["next", next, setNext, "New password"],
          ["confirm", confirm, setConfirm, "Confirm new password"],
        ].map(([key, value, setter, placeholder]) => (
          <div className="password-field" key={key}>
            <input
              type={show[key] ? "text" : "password"}
              placeholder={placeholder}
              value={value}
              onChange={(e) => setter(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => toggle(key)}
            >
              {show[key] ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        ))}

        {error && <div className="auth-error">{error}</div>}

        <div className="confirm-actions">
          <button
            type="button"
            className="confirm-btn cancel"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="confirm-btn confirm"
            disabled={saving}
          >
            {saving ? "Saving..." : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
}
