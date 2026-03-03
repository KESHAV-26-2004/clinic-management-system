// client/src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  return children;
}
 