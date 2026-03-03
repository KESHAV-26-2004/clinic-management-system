// client/src/layouts/AppLayout.jsx
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../styles/layout.css";

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const location = useLocation();

  // Detect tablet
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsTablet(w >= 768 && w <= 1024);
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Force collapsed on tablet
  useEffect(() => {
    if (isTablet) {
      setCollapsed(true);
    }
  }, [isTablet]);

  // Auto close on route change (tablet only)
  useEffect(() => {
    if (isTablet) {
      setCollapsed(true);
    }
  }, [location.pathname, isTablet]);

  // Close when clicking outside (tablet only)
  useEffect(() => {
    if (!isTablet || collapsed) return;

    const handleClick = (e) => {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar && !sidebar.contains(e.target)) {
        setCollapsed(true);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [collapsed, isTablet]);

  return (
    <div
      className={`app-layout 
        ${collapsed ? "sidebar-collapsed" : ""} 
        ${isTablet ? "tablet-mode" : ""}
      `}
    >
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Topbar />
      <main className="app-content">{children}</main>
    </div>
  );
}