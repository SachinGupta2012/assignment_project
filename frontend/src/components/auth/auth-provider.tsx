"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { LoginResponse, User } from "@/types/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("lms_token");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("lms_token");
    if (!savedToken) {
      setLoading(false);
      return;
    }

    setToken(savedToken);
    apiFetch<User>("/api/users/me", { token: savedToken })
      .then(setUser)
      .catch(logout)
      .finally(() => setLoading(false));
  }, [logout]);

  useEffect(() => {
    window.addEventListener("lms:unauthorized", logout);
    return () => window.removeEventListener("lms:unauthorized", logout);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      authenticated: false,
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("lms_token", result.token);
    setToken(result.token);
    const currentUser = await apiFetch<User>("/api/users/me", { token: result.token });
    setUser(currentUser);
    return currentUser;
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
