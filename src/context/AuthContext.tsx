'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  designation?: string | null;
  phone?: string | null;
  subsidiary?: { id: string; name: string; code: string } | null;
  mine?: { id: string; name: string; code: string } | null;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  login: (arg1: string, arg2?: unknown) => Promise<boolean>;
  logout: () => void;
  switchDemoRole: (role: string) => Promise<void>;
  isLoginOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const login = async (arg1: string, arg2?: unknown) => {
    if (typeof arg2 === 'object' && arg2 !== null) {
      const newToken = arg1;
      const newUser = arg2 as UserProfile;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('cg_token', newToken);
      localStorage.setItem('cg_user', JSON.stringify(newUser));
      document.cookie = `cg_token=${newToken}; path=/; max-age=604800`;
      return true;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: arg1, password: arg2 as string }),
      });

      if (!res.ok) return false;
      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('cg_token', data.token);
      localStorage.setItem('cg_user', JSON.stringify(data.user));
      document.cookie = `cg_token=${data.token}; path=/; max-age=604800`;
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const switchDemoRole = async (role: string) => {
    setLoading(true);
    let email = 'admin@coalguard.demo';

    if (role === 'MANAGER' || role === 'MINE_OFFICIAL') email = 'manager@coalguard.demo';
    else if (role === 'FIELD_INSPECTOR') email = 'inspector.singh@dgms.gov.in';
    else if (role === 'REGULATORY_AUTHORITY') email = 'regulatory.cpcb@gov.in';
    else if (role === 'CONTRACTOR') email = 'contact@bharatexcavators.com';

    await login(email, 'CoalGuard@2026');
    setLoading(false);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('cg_token');
    const storedUser = localStorage.getItem('cg_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    } else {
      switchDemoRole('MINE_OFFICIAL');
    }
  }, []);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cg_token');
    localStorage.removeItem('cg_user');
    document.cookie = 'cg_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const openLoginModal = () => setIsLoginOpen(true);
  const closeLoginModal = () => setIsLoginOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        switchDemoRole,
        isLoginOpen,
        openLoginModal,
        closeLoginModal,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
