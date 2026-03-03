// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";

import AdminLayout from "./layouts/AdminLayout";
import DoctorLayout from "./layouts/DoctorLayout";

import Login from "./auth/Login";
import ChangePassword from "./auth/ChangePassword";
import HomeRouter from "./pages/HomeRouter";
import Setup from "./pages/Setup";

import Queue from "./pages/Queue";
import Patients from "./pages/Patients";
import PatientProfile from "./pages/PatientProfile";
import Reports from "./pages/Reports";
import AdminUsers from "./pages/AdminUsers";
import Settings from "./pages/Settings";
import AdminClinicSettings from "./pages/AdminClinicSettings";

function AppRoutes() {
  const { loading, setupRequired, backendDown } = useAuth();

  // 🔄 WAIT UNTIL SETUP CHECK FINISHES
  if (loading) {
    return <div>Loading system…</div>;
  }

  if (backendDown) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Server Unavailable</h2>
        <p>
          Unable to connect to backend server.
          <br />
          Please ensure clinic server is running.
        </p>
      </div>
    );
  }

  // 🧱 SETUP MODE — ONLY /setup IS ALLOWED
  if (setupRequired) {
    return (
      <Routes>
        <Route path="/setup" element={<Setup />} />
        <Route path="*" element={<Navigate to="/setup" />} />
      </Routes>
    );
  }

  // ✅ NORMAL APPLICATION ROUTES
  return (
    <Routes>
      {/* ================= AUTH ================= */}
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />

      {/* ================= HOME ================= */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeRouter />
          </ProtectedRoute>
        }
      />

      {/* ================= ADMIN ================= */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <RoleGuard allowed={["ADMIN"]}>
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/clinic"
        element={
          <ProtectedRoute>
            <RoleGuard allowed={["ADMIN"]}>
              <AdminLayout>
                <AdminClinicSettings />
              </AdminLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* ================= QUEUE ================= */}
      <Route
        path="/queue"
        element={
          <ProtectedRoute>
            <RoleGuard allowed={["ADMIN", "DOCTOR", "STAFF"]}>
              <DoctorLayout>
                <Queue />
              </DoctorLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* ================= PATIENTS ================= */}
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <RoleGuard allowed={["ADMIN", "DOCTOR", "STAFF"]}>
              <DoctorLayout>
                <Patients />
              </DoctorLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/patients/:patientId"
        element={
          <ProtectedRoute>
            <RoleGuard allowed={["ADMIN", "DOCTOR", "STAFF"]}>
              <DoctorLayout>
                <PatientProfile />
              </DoctorLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* ================= REPORTS ================= */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <RoleGuard allowed={["DOCTOR", "STAFF"]}>
              <DoctorLayout>
                <Reports />
              </DoctorLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      
      {/* ================= SETTINGS ================= */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <RoleGuard allowed={["ADMIN", "DOCTOR", "STAFF"]}>
              <DoctorLayout>
                <Settings />
              </DoctorLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}