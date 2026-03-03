// client/src/auth/AuthContext.jsx
import api from "../api/apiClient";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendDown, setBackendDown] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);

  useEffect(() => {
  async function init() {
    try {
      const res = await api.get("/setup/status");

      if (res.data.setupRequired) {
        setSetupRequired(true);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Backend unreachable");
      setBackendDown(true);
      setLoading(false);
      return;
    }

    // Restore auth only if setup is NOT required
    const t = localStorage.getItem("token");
    if (t) {
      try {
        const payload = JSON.parse(atob(t.split(".")[1]));
        setToken(t);

        const profileRes = await api.get("/profile/me", {
          headers: { Authorization: `Bearer ${t}` },
        });

        setUser({
          ...payload,
          ...profileRes.data,
        });
      } catch {
        localStorage.removeItem("token");
        setToken(null);
      }
    }

    setLoading(false);
  }

  init();
}, []);

  async function login(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);

    const payload = JSON.parse(atob(newToken.split(".")[1]));

    try {
      const profileRes = await api.get("/profile/me", {
        headers: { Authorization: `Bearer ${newToken}` },
      });

      setUser({
        ...payload,
        ...profileRes.data,
      });
    } catch {
      logout();
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, loading, setupRequired, backendDown }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
