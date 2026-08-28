'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cpu, Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function LoginFormContent() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      login(data.token, data.user);

      const role = data.user.role;
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        router.push('/?tab=admin-documents');
      } else {
        router.push('/?tab=documents');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check network connection.');
      setLoading(false);
    }
  };

  const fillQuickCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('CoalGuard@2026');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-amber-500/20 mb-2">
            <Cpu className="w-8 h-8 text-slate-950 font-bold" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider">
            COAL-GUARD <span className="text-amber-500 text-sm px-2 py-0.5 rounded bg-amber-950 border border-amber-700/50">AI</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Smart Mining Governance, Compliance & Risk Monitoring Portal
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" /> Account Sign In
            </h2>
            <p className="text-xs text-slate-400">Enter your credentials to access your dashboard</p>
          </div>

          {errorMsg && (
            <div className="bg-red-950/80 border border-red-800 text-red-300 p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Work Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@coalguard.demo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1 text-slate-500 hover:text-slate-300"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In to Portal
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Development Demo Accounts
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickCredentials('admin@coalguard.demo')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-left space-y-0.5 transition-all group"
              >
                <div className="font-bold text-amber-400 group-hover:text-amber-300 flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" /> ADMIN
                </div>
                <div className="text-[10px] text-slate-400 truncate">admin@coalguard.demo</div>
              </button>

              <button
                type="button"
                onClick={() => fillQuickCredentials('manager@coalguard.demo')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-left space-y-0.5 transition-all group"
              >
                <div className="font-bold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> MANAGER
                </div>
                <div className="text-[10px] text-slate-400 truncate">manager@coalguard.demo</div>
              </button>
            </div>
            <div className="text-[10px] text-slate-500 text-center font-mono pt-1">
              Shared Demo Password: <span className="text-slate-300">CoalGuard@2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginFormContent />
    </AuthProvider>
  );
}
