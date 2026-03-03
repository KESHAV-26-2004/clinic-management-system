// client/src/pages/Settings.jsx
import { useEffect, useState } from "react";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import { formatName } from "../utils/format";
import ChangePasswordModal from "../components/ChangePasswordModal";
import { getImageUrl } from "../utils/getImageUrl";
import "../styles/settings.css";

export default function Settings() {
  const { user, login } = useAuth();
  const [passwordOpen, setPasswordOpen] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
      });

      if (user.avatar_url) {
        setAvatarPreview(getImageUrl(user.avatar_url));
      } else {
        setAvatarPreview(null);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setConfirmOpen(true);
  };

  const uploadAvatar = async () => {
    if (!selectedFile) return;

    const data = new FormData();
    data.append("avatar", selectedFile);

    await api.post("/upload/avatar", data);

    setConfirmOpen(false);
    setSelectedFile(null);

    login(localStorage.getItem("token")); // refresh profile
  };

  const saveProfile = async () => {
    setLoading(true);

    try {
        const formattedData = {
        first_name: form.first_name
            ? formatName(form.first_name)
            : "",
        last_name: form.last_name
            ? formatName(form.last_name)
            : "",
        email: form.email,
        };

        await api.patch("/profile/me", formattedData);

        // Refresh profile properly
        const token = localStorage.getItem("token");
        await login(token);

    } catch (err) {
        alert("Failed to update profile");
    }

    setLoading(false);
    };

  return (
    <div className="settings-page">
      <div className="canvas settings-card">
        <div className="canvas-header">
          <span className="canvas-title">Profile Settings</span>
        </div>

        {/* ===== AVATAR SECTION ===== */}
        <div className="avatar-section">
          <div className="avatar-large">
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" />
            ) : (
              <span>
                {user?.username?.[0]?.toUpperCase()}
              </span>
            )}
          </div>

          <label className="avatar-upload-btn">
            Change Avatar
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileSelect}
            />
          </label>
        </div>

        {/* ===== FORM ===== */}
        <div className="settings-form">
          <div className="settings-row">
            <input
              name="first_name"
              placeholder="First Name"
              value={form.first_name}
              onChange={handleChange}
            />
            <input
              name="last_name"
              placeholder="Last Name"
              value={form.last_name}
              onChange={handleChange}
            />
          </div>

          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />

          <button
            className="primary-btn"
            onClick={saveProfile}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="canvas settings-card security-card">
        <div className="canvas-header">
            <span className="canvas-title">Security</span>
        </div>

        <div className="security-section">
            <button
            className="secondary-btn"
            onClick={() => setPasswordOpen(true)}
            >
            Change Password
            </button>
        </div>
        </div>

      <ConfirmModal
        open={confirmOpen}
        title="Confirm Avatar Upload"
        message="Do you want to set this as your new profile picture?"
        onConfirm={uploadAvatar}
        onCancel={() => {
          setConfirmOpen(false);
          if (user?.avatar_url) {
            setAvatarPreview(getImageUrl(user.avatar_url));
          } else {
            setAvatarPreview(null);
          }
        }}
      />
      <ChangePasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        />

    </div>
  );
}
