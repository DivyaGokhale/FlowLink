import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { useNavigate } from 'react-router-dom';
import { apiService } from '../lib/api';
import { app } from "../lib/firebase";
import { API_BASE } from "../config";
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
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  vipEligible: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ shopSlug?: string }>;
  register: (payload: { name?: string; email: string; password: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => void;
  hydrated: boolean;
  clearError: () => void;
  updateEmail: (newEmail: string, password: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (updates: { displayName?: string; phone?: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [vipEligible, setVipEligible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const updateEmail = async (newEmail: string, password: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setIsLoading(true);
      // In a real app, you would verify the current password first
      // Then update the email through your authentication provider
      const response = await fetch(`${API_BASE}/auth/update-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          newEmail,
          password
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update email');
      }

      // Update local user state
      setUser(prev => prev ? { ...prev, email: newEmail } : null);
    } catch (err: any) {
      setError(err.message || 'Failed to update email');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/auth/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: user.email,
          currentPassword,
          newPassword
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update password');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: { displayName?: string; phone?: string }) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setIsLoading(true);
      
      // Call the API to update the profile
      const response = await apiService.updateProfile(user.id, updates);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update profile');
      }
      
      // Update local user state with the new data
      setUser(prev => (prev ? { ...prev, ...updates } : null));
      
      // Update localStorage if needed
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsedAuth = JSON.parse(authData);
        localStorage.setItem('auth', JSON.stringify({
          ...parsedAuth,
          user: {
            ...parsedAuth.user,
            ...updates
          }
        }));
      }
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("auth");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed.user || null);
        setToken(parsed.token || null);
      } catch (err) {
        console.error("Error loading auth from localStorage:", err);
        setError("Failed to load authentication data");
      }
    }
    setHydrated(true);
  }, []);

  const refreshEligibility = async (emailHint?: string) => {
    try {
      const shop = guessShop() || undefined;
      const params = new URLSearchParams();
      if (shop) params.set('shop', shop);
      const email = (emailHint || user?.email || '').trim();
      if (email) params.set('email', email);
      const headers: Record<string,string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/auth/eligibility?${params.toString()}`, { headers });
      if (!res.ok) { setVipEligible(false); return; }
      const data = await res.json();
      setVipEligible(Boolean(data?.eligible));
    } catch {
      setVipEligible(false);
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    if (user?.email) {
      refreshEligibility(user.email);
    } else {
      setVipEligible(false);
    }
  }, [hydrated, token, user?.email]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("auth", JSON.stringify({ user, token }));
  }, [user, token, hydrated]);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
  // Infer shop slug from URL or localStorage so the auth API can map to seller
  const RESERVED_PATHS = new Set(["login","signup","product","addToCart","payment","shop","orders","order"])
  const guessShop = () => {
    try {
      const saved = localStorage.getItem("shopSlug")
      if (saved) return saved
    } catch {}
    const seg = (typeof window !== 'undefined' ? window.location.pathname : '').split('/').filter(Boolean)[0] || ''
    return RESERVED_PATHS.has(seg) ? '' : seg
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, shop: guessShop() || undefined }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Login failed");
      }
      
      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      await refreshEligibility(data?.user?.email);

      // Persist shop slug for future navigations and API calls
      if (data?.shopSlug) {
        try { localStorage.setItem('shopSlug', String(data.shopSlug)); } catch {}
      }

      return { shopSlug: data?.shopSlug };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: { name?: string; email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, shop: guessShop() || undefined }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Registration failed");
      }
      
      // Some backends return token+user on register; support both flows
      try {
        const data = await res.json();
        if (data?.token && data?.user) {
          setToken(data.token);
          setUser(data.user);
          await refreshEligibility(data?.user?.email);
        }
      } catch {
        // No JSON body (e.g., 204). It's fine; user can log in next.
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
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
    await refreshEligibility(profile.email);
  };

  const loginWithGoogle = () => socialLogin("google");
  const loginWithMicrosoft = () => socialLogin("microsoft");

  const logout = () => {
    const auth = getAuth(app);
    try { signOut(auth); } catch {}
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth");
    localStorage.removeItem("cart"); // Clear cart from localStorage
    
    // Dispatch a custom event to notify other components about logout
    window.dispatchEvent(new Event('userLoggedOut'));
    
    setVipEligible(false);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    vipEligible,
    isLoading,
    error,
    login,
    register,
    loginWithGoogle,
    loginWithMicrosoft,
    logout,
    hydrated,
    clearError,
    updateEmail,
    updatePassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
