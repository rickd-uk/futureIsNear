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

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("user_token");

    if (!token) {
      setState({ user: null, loading: false, error: null });
      return;
    }

    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setState({ user: data.user, loading: false, error: null });
      } else {
        localStorage.removeItem("user_token");
        setState({ user: null, loading: false, error: null });
      }
    } catch {
      setState({ user: null, loading: false, error: "Failed to check auth" });
    }
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
