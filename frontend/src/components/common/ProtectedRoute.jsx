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
  const { currentUser, isLoading } = useAuth();

  // Show loader while checking stored auth state
  if (isLoading) return <Loader fullScreen />;

  // Not authenticated → redirect to login
  if (!currentUser) return <Navigate to="/login" replace />;

  // Authenticated → render the nested route
  return <Outlet />;
};

export default ProtectedRoute;
