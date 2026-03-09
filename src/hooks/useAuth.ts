"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  username: string;
  email: string | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

function parseJwt(token: string): { userId: string; username: string; exp: number } | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.type !== "user" || !payload.userId || !payload.username) return null;
    return payload;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(() => {
    // Synchronously decode token on first render — no network call needed
    if (typeof window === "undefined") return { user: null, loading: false, error: null };
    const token = localStorage.getItem("user_token");
    if (!token) return { user: null, loading: false, error: null };
    const payload = parseJwt(token);
    if (!payload || payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("user_token");
      return { user: null, loading: false, error: null };
    }
    return { user: { id: payload.userId, username: payload.username, email: null }, loading: false, error: null };
  });

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem("user_token");
    if (!token) {
      setState({ user: null, loading: false, error: null });
      return;
    }
    const payload = parseJwt(token);
    if (!payload || payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("user_token");
      setState({ user: null, loading: false, error: null });
      return;
    }
    setState({ user: { id: payload.userId, username: payload.username, email: null }, loading: false, error: null });
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("user_token", data.token);
      setState({ user: data.user, loading: false, error: null });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setState((prev) => ({ ...prev, error: message }));
      return { success: false, error: message };
    }
  };

  const signup = async (username: string, password: string, email?: string) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      localStorage.setItem("user_token", data.token);
      setState({ user: data.user, loading: false, error: null });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Signup failed";
      setState((prev) => ({ ...prev, error: message }));
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem("user_token");
    setState({ user: null, loading: false, error: null });
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    login,
    signup,
    logout,
    checkAuth,
  };
}
