// client/src/pages/HomeRouter.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function HomeRouter() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  if (user.role === "ADMIN") {
    return <Navigate to="/admin/users" />;
  }

  if (user.role === "DOCTOR" || user.role === "STAFF") {
    return <Navigate to="/queue" />;
  }

  return <Navigate to="/login" />;
}
