/**
 * PublicRoute.jsx — Public-Only Route Guard
 *
 * Mirror of ProtectedRoute, but for the opposite case:
 *  - While auth is loading → show full-screen Loader (prevents flash)
 *  - If user IS authenticated → redirect to /feed (they don't need landing/login)
 *  - If user is NOT authenticated → render <Outlet /> (the public page)
 *
 * Used for:
 *  / (LandingPage) — authenticated users bounce to /feed
 *  /login          — logged-in users don't need to see login again
 *  /signup         — same
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth }          from "../../hooks/useAuth.js";
import Loader               from "./Loader.jsx";

const PublicRoute = () => {
  const { user, loading } = useAuth();

  // Show loader while /api/auth/me is in-flight — prevents a flash of the
  // landing page before we know the user is actually authenticated.
  if (loading) return <Loader fullScreen text="Loading Lynqo..." />;

  // Authenticated → redirect to the feed (they don't belong here)
  if (user) return <Navigate to="/feed" replace />;

  // Not authenticated → render the nested public route
  return <Outlet />;
};

export default PublicRoute;
