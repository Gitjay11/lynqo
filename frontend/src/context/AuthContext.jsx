/**
 * AuthContext.jsx — Global Authentication State
 *
 * Provides:
 *  - user        : the verified, logged-in user object (or null)
 *  - token       : the stored JWT (or null)
 *  - loading     : true while the /me check is in-flight on first load
 *  - login()     : persist user + token → state + localStorage
 *  - logout()    : clear state + localStorage → redirect to /login
 *
 * Session restore strategy (on mount):
 *  1. Read lynqo_token from localStorage.
 *  2. If it exists, call GET /api/auth/me to verify it server-side.
 *  3. On success  → populate user state (fresh data from DB).
 *  4. On 401/fail → clear localStorage (token expired/tampered).
 *  5. Set loading: false after the check completes either way.
 *
 * This prevents a user with a tampered or expired token from appearing
 * authenticated to the UI, which would only fail later on a data call.
 */

import { createContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios.js";

// ── Context creation ──────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true); // true until /me resolves

  // ── On app boot: verify any stored token against the server ────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("lynqo_token");

      if (!storedToken) {
        // No token at all — skip the network call
        setLoading(false);
        return;
      }

      try {
        // Token exists → verify it is still valid (not expired / revoked)
        // axios.js request interceptor will attach the Bearer header automatically
        const { data } = await api.get("/auth/me");

        // Server returned the live user object — restore session
        setUser(data.user);
        setToken(storedToken);
      } catch (err) {
        // 401 or network error: token is bad → wipe everything
        // The axios response interceptor also clears localStorage on 401,
        // but we do it here explicitly for any non-401 failure edge cases.
        localStorage.removeItem("lynqo_token");
        localStorage.removeItem("lynqo_user");
        setUser(null);
        setToken(null);
      } finally {
        // Always unblock the UI, even if the request failed
        setLoading(false);
      }
    };

    restoreSession();
  }, []); // run once on mount only

  // ── login() — called after successful signup or login API response ──────────
  const login = useCallback((userData, authToken) => {
    // Persist to localStorage so the session survives page refresh
    localStorage.setItem("lynqo_token", authToken);
    localStorage.setItem("lynqo_user", JSON.stringify(userData));

    // Update React state
    setUser(userData);
    setToken(authToken);
  }, []);

  // ── logout() — called by user action or interceptor-triggered 401 ───────────
  const logout = useCallback(() => {
    // Wipe persisted auth data
    localStorage.removeItem("lynqo_token");
    localStorage.removeItem("lynqo_user");

    // Clear React state
    setUser(null);
    setToken(null);

    // Hard redirect — ensures socket, axios headers, and all state are clean
    window.location.href = "/login";
  }, []);

  // ── Context value — stable shape consumed by useAuth() ────────────────────
  const value = {
    user,     // the verified user object (or null)
    token,    // raw JWT string (or null)
    loading,  // true while /me is in-flight
    login,    // (userData, token) => void
    logout,   // () => void
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
