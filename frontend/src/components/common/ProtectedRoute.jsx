/**
 * ProtectedRoute.jsx — Route Guard
 *
 * Wraps protected routes. If the user is not authenticated,
 * redirects to /login. While auth state is loading from localStorage,
 * renders a full-screen loader so there's no flash of redirect.
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import Loader from "./Loader.jsx";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // Show loader while /api/auth/me is in-flight
  if (loading) return <Loader fullScreen />;

  // Not authenticated → redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // Authenticated → render the nested route
  return <Outlet />;
};

export default ProtectedRoute;
