/**
 * App.jsx — Root Application Component
 *
 * Responsibilities:
 *  1. Wrap the entire app in <AuthProvider> so every component can read auth state.
 *  2. Wrap in <SocketProvider> (nested inside AuthProvider so it can call useAuth).
 *  3. Define the complete client-side route tree using React Router v7.
 *  4. Gate all private routes behind <ProtectedRoute> (checks auth + loading state).
 *  5. Gate public-only routes behind <PublicRoute> (redirects logged-in users).
 *  6. Mount <Toaster> globally for react-hot-toast notifications.
 *
 * Route map:
 *  /             → PublicRoute  → LandingPage   (unauthenticated only → /feed if logged in)
 *  /login        → PublicRoute  → LoginPage      (unauthenticated only → /feed if logged in)
 *  /signup       → PublicRoute  → SignupPage     (unauthenticated only → /feed if logged in)
 *  /feed         → ProtectedRoute → FeedPage
 *  /anon         → ProtectedRoute → AnonPage
 *  /chat         → ProtectedRoute → ChatPage
 *  /chat/:convId → ProtectedRoute → ChatPage
 *  /profile/:id  → ProtectedRoute → ProfilePage
 *  *             → NotFoundPage
 */

import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// ── Context providers ─────────────────────────────────────────────────────────
import { AuthProvider }   from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";

// ── Route guards ──────────────────────────────────────────────────────────────
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import PublicRoute    from "./components/common/PublicRoute.jsx";
import AppLayout      from "./components/common/AppLayout.jsx";

// ── Public / landing pages ────────────────────────────────────────────────────
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage   from "./pages/auth/LoginPage.jsx";
import SignupPage  from "./pages/auth/SignupPage.jsx";

// ── Protected pages ───────────────────────────────────────────────────────────
import FeedPage    from "./pages/FeedPage.jsx";
import AnonPage    from "./pages/AnonPage.jsx";
import ChatPage    from "./pages/ChatPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

// ── Catch-all ─────────────────────────────────────────────────────────────────
import NotFoundPage from "./pages/NotFoundPage.jsx";

// ─────────────────────────────────────────────────────────────────────────────
const App = () => {
  return (
    /**
     * Provider nesting order matters:
     *  AuthProvider   — outermost, provides user/token/loading to everything below
     *  SocketProvider — inside AuthProvider so it can call useAuth() internally
     */
    <AuthProvider>
      <SocketProvider>

        {/*
         * Toaster — positioned top-center so toasts never collide with the
         * fixed BottomTabBar (which is always visible at bottom-0 on mobile).
         * containerStyle.paddingTop clears the 56px fixed Navbar so the first
         * toast isn't hidden behind it.
         * Max 3 visible toasts at once (gutter size).
         */}
        <Toaster
          position="top-center"
          gutter={8}
          containerStyle={{ paddingTop: "60px" }}
          toastOptions={{
            duration: 3500,
            style: {
              background: "#1f2937", // gray-800
              color: "#f9fafb",      // gray-50
              borderRadius: "12px",
              fontSize: "14px",
              padding: "12px 16px",
              maxWidth: "340px",
            },
            success: {
              iconTheme: {
                primary: "#6366f1", // brand-500
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#f43f5e", // rose-500
                secondary: "#fff",
              },
            },
          }}
        />

        <Routes>
          {/* ── Public-only routes (logged-in users redirected to /feed) ─── */}
          {/*
           * PublicRoute checks auth state:
           *   loading → full-screen spinner (no flash)
           *   user    → <Navigate to="/feed" replace />
           *   no user → <Outlet /> (renders the public page)
           */}
          <Route element={<PublicRoute />}>
            {/* Landing page — first thing unauthenticated visitors see */}
            <Route path="/"       element={<LandingPage />} />
            <Route path="/login"  element={<LoginPage />}   />
            <Route path="/signup" element={<SignupPage />}  />
          </Route>

          {/* ── Protected routes (redirect to /login if unauthenticated) ─── */}
          {/*
           * ProtectedRoute guards auth. AppLayout provides the shell:
           *   Navbar (top) + Sidebar (desktop) + BottomTabBar (mobile).
           * Nesting: ProtectedRoute → AppLayout → individual page
           */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Community Feed — now at /feed (was /) */}
              <Route path="/feed" element={<FeedPage />} />

              {/* Anonymous board */}
              <Route path="/anon" element={<AnonPage />} />

              {/* Chat — list view */}
              <Route path="/chat" element={<ChatPage />} />

              {/* Chat — open specific conversation */}
              <Route path="/chat/:convId" element={<ChatPage />} />

              {/* User profile */}
              <Route path="/profile/:id" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* ── 404 catch-all ──────────────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
