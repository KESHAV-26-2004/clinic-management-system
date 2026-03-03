import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import api from "../api/apiClient";
import { getImageUrl } from "../utils/getImageUrl";
import "../styles/auth.css";

export default function Login() {
  const { login } = useAuth();
  const [logo, setLogo] = useState(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remote, setRemote] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "");
  }, []);

  useEffect(() => {
    async function loadLogo() {
      try {
        const res = await api.get("/clinic/public");
        const data = res.data;

        if (data.logo_path) {
          setLogo(getImageUrl(`/uploads/${data.logo_path}`));
        }
      } catch {}
    }

    loadLogo();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login", {
        username,
        password,
        accessMode: remote ? "REMOTE" : "LOCAL",
      });

      login(res.data.token);
      window.location.href = "/";
    } catch (err) {
      setError(
        err.response?.data?.error || "Cannot connect to server"
      );
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        {logo && (
          <div className="login-logo-wrapper">
            <img src={logo} alt="Clinic Logo" className="login-logo" />
          </div>
        )}
        <h1 className="auth-title">Clinic Management System</h1>
        <p className="auth-subtitle">
          Sign in to continue to your dashboard
        </p>

        {/* Username */}
        <div className="auth-field">
          <input
            type="text"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        {/* Password */}
        <div className="auth-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Passcode"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="button"
            className="show-password-btn"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* Remote Login (Hidden for now) */}
        {false && (
          <div className="auth-options">
            <label>
              <input
                type="checkbox"
                checked={remote}
                onChange={(e) => setRemote(e.target.checked)}
              />
              Remote login
            </label>
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        <button className="auth-btn" type="submit">
          Sign in
        </button>

        <div className="auth-footer">
          Secure access for authorized staff only
        </div>
      </form>
    </div>
  );
}