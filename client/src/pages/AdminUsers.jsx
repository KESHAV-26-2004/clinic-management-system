// client/src/pages/AdminUsers.jsx
import { useEffect, useState } from "react";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import "../styles/adminpage.css";

export default function AdminUsers() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("DOCTOR");

  const loadUsers = async () => {
    const res = await api.get("/users");
    setUsers(res.data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const createUser = async () => {
    if (!username || !password) {
      alert("Username and password required");
      return;
    }

    await api.post("/users", { username, password, role });
    setUsername("");
    setPassword("");
    loadUsers();
  };

  const disableUser = async (id) => {
    await api.patch(`/users/${id}/disable`);
    loadUsers();
  };

  const enableUser = async (id) => {
    await api.patch(`/users/${id}/enable`);
    loadUsers();
  };

  const resetPassword = async (id) => {
    const res = await api.post(`/users/${id}/reset-password`);
    alert(`Temporary password: ${res.data.tempPassword}`);
    loadUsers();
  };

  const triggerBackup = async () => {
  if (!window.confirm("Create backup now?")) return;

  try {
    await api.post("/admin/backup");
      alert("Backup completed successfully");
    } catch (err) {
      alert("Backup failed");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;

    try {
      await api.delete(`/users/${id}`);
      alert("User deleted successfully");
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || "Delete failed");
    }
  };

  return (
  <div className="admin-page">
    <div className="admin-canvas">
      <div className="admin-title">User Management</div>

      <button
        onClick={triggerBackup}
        className="admin-btn dark"
      >
        Backup Now
      </button>
    </div>

    <div className="admin-canvas">
      <div className="admin-title">Create User</div>

      <input
        className="admin-input"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        className="admin-input"
        placeholder="Temporary Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <select
        className="admin-select"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="DOCTOR">Doctor</option>
        <option value="STAFF">Staff</option>
      </select>

      <button
        onClick={createUser}
        className="admin-btn primary"
      >
        Create
      </button>
    </div>

    <div className="admin-canvas">
      <div className="admin-title">Existing Users</div>

      <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.role}</td>
              <td>{u.is_active ? "Active" : "Disabled"}</td>
              <td className="admin-actions">
                {u.id !== user.id && (
                  <button
                    className="admin-btn secondary"
                    onClick={() => resetPassword(u.id)}
                  >
                    Reset
                  </button>
                )}
                {u.role !== "ADMIN" && u.id !== user.id && (
                  <>
                    {u.is_active ? (
                      <button
                        className="admin-btn secondary"
                        onClick={() => disableUser(u.id)}
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        className="admin-btn secondary"
                        onClick={() => enableUser(u.id)}
                      >
                        Enable
                      </button>
                    )}

                    <button
                      className="admin-btn danger"
                      onClick={() => deleteUser(u.id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  </div>
);
}
