/**
 * useAuth.js — Custom hook to consume AuthContext
 * Usage: const { user, token, loading, login, logout } = useAuth();
 */

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an <AuthProvider>");
  }
  return context;
};
