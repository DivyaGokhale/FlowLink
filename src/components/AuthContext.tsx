import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { app } from "../lib/firebase";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

interface User {
  id: string;
  name?: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name?: string; email: string; password: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => void;
  hydrated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("auth");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed.user || null);
        setToken(parsed.token || null);
      } catch {}
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("auth", JSON.stringify({ user, token }));
  }, [user, token, hydrated]);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Login failed");
    }
    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (payload: { name?: string; email: string; password: string }) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Registration failed");
    }
    // Some backends return token+user on register; support both flows
    try {
      const data = await res.json();
      if (data?.token && data?.user) {
        setToken(data.token);
        setUser(data.user);
      }
    } catch {
      // No JSON body (e.g., 204). It's fine; user can log in next.
    }
  };

  const socialLogin = async (providerName: "google" | "microsoft") => {
    const auth = getAuth(app);
    const provider =
      providerName === "google"
        ? new GoogleAuthProvider()
        : new OAuthProvider("microsoft.com");
    const result = await signInWithPopup(auth, provider as any);
    const fUser = result.user;
    const idToken = await fUser.getIdToken();
    const profile = {
      id: fUser.uid,
      name: fUser.displayName || "",
      email: fUser.email || "",
    };
    setUser(profile);
    setToken(idToken);
  };

  const loginWithGoogle = () => socialLogin("google");
  const loginWithMicrosoft = () => socialLogin("microsoft");

  const logout = () => {
    const auth = getAuth(app);
    try { signOut(auth); } catch {}
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth");
  };

  const value = useMemo(
    () => ({ user, token, isAuthenticated: Boolean(token), login, register, loginWithGoogle, loginWithMicrosoft, logout, hydrated }),
    [user, token, hydrated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
