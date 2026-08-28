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
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchDemoRole: (role: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial user or demo user from localStorage / API
    const storedToken = localStorage.getItem('cg_token');
    const storedUser = localStorage.getItem('cg_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setLoading(false);
    } else {
      // Default to Super Admin demo account on first load
      switchDemoRole('SUPER_ADMIN');
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) return false;
      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('cg_token', data.token);
      localStorage.setItem('cg_user', JSON.stringify(data.user));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cg_token');
    localStorage.removeItem('cg_user');
  };

  const switchDemoRole = async (role: string) => {
    setLoading(true);
    let email = 'admin@coalguard.gov.in';

    if (role === 'MINE_OFFICIAL') email = 'gm.sonepur@ecl.coalindia.in';
    else if (role === 'FIELD_INSPECTOR') email = 'inspector.singh@dgms.gov.in';
    else if (role === 'REGULATORY_AUTHORITY') email = 'regulatory.cpcb@gov.in';
    else if (role === 'CONTRACTOR') email = 'contact@bharatexcavators.com';

    await login(email, 'CoalGuard@2026');
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, switchDemoRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
