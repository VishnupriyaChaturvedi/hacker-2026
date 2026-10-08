import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Guards routes that require a logged-in user.
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
