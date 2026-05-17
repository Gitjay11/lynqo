/**
 * App.jsx — Root Application Component
 *
 * Responsibilities:
 *  1. Wrap the entire app in <AuthProvider> so every component can read auth state.
 *  2. Wrap in <SocketProvider> (nested inside AuthProvider so it can call useAuth).
 *  3. Define the complete client-side route tree using React Router v7.
 *  4. Gate all private routes behind <ProtectedRoute> (checks auth + loading state).
 *  5. Mount <Toaster> globally for react-hot-toast notifications.
 *
 * Route map:
 *  /login            → LoginPage       (public)
 *  /signup           → SignupPage      (public)
 *  /                 → ProtectedRoute → FeedPage
 *  /anon             → ProtectedRoute → AnonPage
 *  /chat             → ProtectedRoute → ChatPage
 *  /chat/:convId     → ProtectedRoute → ChatPage
 *  /profile/:id      → ProtectedRoute → ProfilePage
 *  *                 → NotFoundPage
 */

import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// ── Context providers ─────────────────────────────────────────────────────────
import { AuthProvider }   from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";

// ── Route guard ───────────────────────────────────────────────────────────────
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import AppLayout      from "./components/common/AppLayout.jsx";

// ── Public pages ──────────────────────────────────────────────────────────────
import LoginPage  from "./pages/auth/LoginPage.jsx";
import SignupPage from "./pages/auth/SignupPage.jsx";

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
         * Global toast notifications — positioned at the bottom-center
         * for mobile ergonomics (thumb-reachable zone).
         */}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1f2937", // gray-800
              color: "#f9fafb",      // gray-50
              borderRadius: "12px",
              fontSize: "14px",
              padding: "12px 16px",
            },
            success: {
              iconTheme: {
                primary: "#6366f1", // brand-500
                secondary: "#fff",
              },
            },
          }}
        />

        <Routes>
          {/* ── Public routes (no auth required) ───────────────────────── */}
          <Route path="/login"  element={<LoginPage />}  />
          <Route path="/signup" element={<SignupPage />} />

          {/* ── Protected routes (redirect to /login if unauthenticated) ─ */}
          {/*
           * ProtectedRoute guards auth. AppLayout provides the shell:
           *   Navbar (top) + Sidebar (desktop) + BottomTabBar (mobile).
           * Nesting: ProtectedRoute → AppLayout → individual page
           */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Home / Community Feed */}
              <Route path="/" element={<FeedPage />} />

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

          {/* ── 404 catch-all ─────────────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
