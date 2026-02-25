"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const TOKEN_KEY = "aspire_token";

interface AuthContextValue {
  token: string | null;
  setToken: (t: string | null) => void;
  logout: () => void;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTokenState(localStorage.getItem(TOKEN_KEY));
    }
    setIsReady(true);
  }, []);

  const setToken = useCallback((t: string | null) => {
    if (typeof window !== "undefined") {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    }
    setTokenState(t);
  }, []);

  const logout = useCallback(() => setToken(null), []);

  return (
    <AuthContext.Provider value={{ token, setToken, logout, isReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
