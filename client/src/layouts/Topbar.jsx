// client/src/layouts/Topbar.jsx
import { useAuth } from "../auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { getImageUrl } from "../utils/getImageUrl";
import { useState } from "react";

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const getPageTitle = () => {
    if (location.pathname.startsWith("/queue")) return "Queue";
    if (location.pathname.startsWith("/patients")) return "Patients";
    if (location.pathname.startsWith("/reports")) return "Reports";
    if (location.pathname.startsWith("/settings")) return "Settings";
    return "Dashboard";
  };
  
  const { user, logout } = useAuth();

  const fullName =
    user?.first_name || user?.last_name
      ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim()
      : user?.username;

  const avatarUrl = user?.avatar_url
    ? getImageUrl(user.avatar_url)
    : null;

  const profileIncomplete =
    !user?.first_name ||
    !user?.last_name ||
    !user?.email ||
    !user?.avatar_url;


  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <button
            className={`mobile-menu-btn ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>

          <div className="page-title">{getPageTitle()}</div>

          <input
            className="topbar-search"
            placeholder="Search patient / phone number"
          />
        </div>

        <div className="topbar-right">
          {profileIncomplete && user?.role !== "ADMIN" && (
            <div
              className="profile-warning"
              onClick={() => navigate("/settings")}
              style={{ cursor: "pointer" }}
            >
              ⚠ Please complete your profile
            </div>
          )}

          <div className="topbar-user">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="avatar small" />
            ) : (
              <div className="avatar small">
                {fullName?.[0]?.toUpperCase() || "U"}
              </div>
            )}

            <div className="user-meta">
              <div className="user-name">{fullName || "User"}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-dropdown">

          {profileIncomplete && user?.role !== "ADMIN" && (
            <div
              className="mobile-profile-warning"
              onClick={() => {
                navigate("/settings");
                setMenuOpen(false);
              }}
            >
              ⚠ Complete your profile
            </div>
          )}

          {/* ===== ADMIN ===== */}
          {user?.role === "ADMIN" && (
            <>
              <div onClick={() => { navigate("/admin/users"); setMenuOpen(false); }}>
                Users
              </div>

              <div onClick={() => { navigate("/admin/clinic"); setMenuOpen(false); }}>
                Clinic
              </div>
            </>
          )}

          {/* ===== DOCTOR ===== */}
          {user?.role === "DOCTOR" && (
            <>
              <div onClick={() => { navigate("/queue"); setMenuOpen(false); }}>
                Queue
              </div>

              <div onClick={() => { navigate("/patients"); setMenuOpen(false); }}>
                Patients
              </div>

              <div onClick={() => { navigate("/reports"); setMenuOpen(false); }}>
                Reports
              </div>
            </>
          )}

          {/* ===== STAFF ===== */}
          {user?.role === "STAFF" && (
            <>
              <div onClick={() => { navigate("/queue"); setMenuOpen(false); }}>
                Queue
              </div>

              <div onClick={() => { navigate("/patients"); setMenuOpen(false); }}>
                Patients
              </div>
            </>
          )}

          {/* ===== COMMON ===== */}
          <div onClick={() => { navigate("/settings"); setMenuOpen(false); }}>
            Settings
          </div>

          <div
            className="mobile-logout"
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
          >
            Logout
          </div>
        </div>
      )}
    </>
  );
}
