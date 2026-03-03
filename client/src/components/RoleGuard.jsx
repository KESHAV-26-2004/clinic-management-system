// client/src/components/RoleGuard.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function RoleGuard({ allowed, children }) {
  const { user } = useAuth();

  if (!allowed.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}
