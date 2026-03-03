// client/src/layouts/Sidebar.jsx
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

import {
  FiHome,
  FiUsers,
  FiList,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiChevronLeft,
} from "react-icons/fi";

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();

  const role = user?.role;

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* HEADER */}
      <div className="sidebar-header">
        {!collapsed && <span className="logo">DentalCare</span>}
        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle sidebar"
        >
          <FiChevronLeft />
        </button>
      </div>

      {/* MAIN NAV */}
      <nav className="sidebar-nav">
        {/* ADMIN */}
        {role === "ADMIN" && (
          <>
            <NavLink to="/admin/users" className="nav-item">
              <FiUsers className="icon" />
              <span className="nav-text">Users</span>
            </NavLink>

            <NavLink to="/admin/clinic" className="nav-item">
              <FiHome className="icon" />
              <span className="nav-text">Clinic</span>
            </NavLink>
          </>
        )}

        {/* DOCTOR */}
        {role === "DOCTOR" && (
          <>
            <NavLink to="/queue" className="nav-item">
              <FiList className="icon" />
              <span className="nav-text">Queue</span>
            </NavLink>

            <NavLink to="/patients" className="nav-item">
              <FiUsers className="icon" />
              <span className="nav-text">Patients</span>
            </NavLink>

            <NavLink to="/reports" className="nav-item">
              <FiBarChart2 className="icon" />
              <span className="nav-text">Reports</span>
            </NavLink>
          </>
        )}

        {/* STAFF */}
        {role === "STAFF" && (
          <>
            <NavLink to="/queue" className="nav-item">
              <FiList className="icon" />
              <span className="nav-text">Queue</span>
            </NavLink>

            <NavLink to="/patients" className="nav-item">
              <FiUsers className="icon" />
              <span className="nav-text">Patients</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* BOTTOM */}
      <div className="sidebar-bottom">
        <NavLink to="/settings" className="nav-item">
          <FiSettings className="icon" />
          <span className="nav-text">Settings</span>
        </NavLink>

        <button className="nav-item logout" onClick={logout}>
          <FiLogOut className="icon" />
          <span className="nav-text">Logout</span>
        </button>
      </div>
    </aside>
  );
}