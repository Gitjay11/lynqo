/**
 * AuthContext.jsx — Global Authentication State
 *
 * Provides:
 *  - currentUser  : the logged-in user object (or null)
 *  - token        : the stored JWT (or null)
 *  - login()      : store user + token, set axios header
 *  - logout()     : clear all auth state
 *  - isLoading    : true while checking localStorage on first load
 *
 * (Full implementation in Stage 1 — Authentication)
 */

import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken]             = useState(null);
  const [isLoading, setIsLoading]     = useState(true);

  // Rehydrate auth state from localStorage on app start
  useEffect(() => {
    const storedUser  = localStorage.getItem("lynqo_user");
    const storedToken = localStorage.getItem("lynqo_token");

    if (storedUser && storedToken) {
      setCurrentUser(JSON.parse(storedUser));
      setToken(storedToken);
    }

    setIsLoading(false);
  }, []);

  const login = (user, authToken) => {
    localStorage.setItem("lynqo_user",  JSON.stringify(user));
    localStorage.setItem("lynqo_token", authToken);
    setCurrentUser(user);
    setToken(authToken);
  };

  const logout = () => {
    localStorage.removeItem("lynqo_user");
    localStorage.removeItem("lynqo_token");
    setCurrentUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
