'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Shield,
  Building2,
  ClipboardList,
  Wind,
  HardHat,
  Lock,
  Mail,
  Key,
  X,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertCircle,
  UserCheck,
  LogOut,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { user, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('CoalGuard@2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoleCard, setSelectedRoleCard] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  if (!isOpen) return null;

  const demoRoles = [
    {
      id: 'SUPER_ADMIN',
      title: 'Super Admin / Corporate',
      badge: 'SUPER ADMIN',
      badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-800',
      icon: Shield,
      name: 'Dr. Ramesh Narayan',
      designation: 'Director General of Mine Safety & Governance',
      email: 'admin@coalguard.gov.in',
      password: 'CoalGuard@2026',
      description: 'Full governance access over ECL, BCCL & CCL subsidiaries, user directory, system audit trail & corporate metrics.',
    },
    {
      id: 'MINE_OFFICIAL',
      title: 'Mine General Manager',
      badge: 'MINE OFFICIAL',
      badgeColor: 'bg-blue-950 text-blue-400 border-blue-800',
      icon: Building2,
      name: 'Rajesh Sharma',
      designation: 'General Manager - Sonepur Bazari OCP (ECL)',
      email: 'gm.sonepur@ecl.coalindia.in',
      password: 'CoalGuard@2026',
      description: 'Mine operations control, pit tonnage targets, contractor oversight, worker attendance & safety compliance.',
    },
    {
      id: 'FIELD_INSPECTOR',
      title: 'DGMS Field Inspector',
      badge: 'FIELD INSPECTOR',
      badgeColor: 'bg-amber-950 text-amber-400 border-amber-800',
      icon: ClipboardList,
      name: 'Amitabh Singh',
      designation: 'Senior Statutory DGMS Inspector',
      email: 'inspector.singh@dgms.gov.in',
      password: 'CoalGuard@2026',
      description: 'Mobile field audit tool, GPS photo evidence capture, violation issuing & multi-tier CAPA escalation enforcement.',
    },
    {
      id: 'REGULATORY_AUTHORITY',
      title: 'CPCB Regulatory Officer',
      badge: 'REGULATORY',
      badgeColor: 'bg-purple-950 text-purple-400 border-purple-800',
      icon: Wind,
      name: 'Priyanka Banerjee',
      designation: 'CPCB State Environmental Protection Officer',
      email: 'regulatory.cpcb@gov.in',
      password: 'CoalGuard@2026',
      description: 'Real-time air PM10/PM2.5 telemetry, mine water pH monitoring, environmental permit approvals & statutory reporting.',
    },
    {
      id: 'CONTRACTOR',
      title: 'Contractor & Vendor',
      badge: 'CONTRACTOR',
      badgeColor: 'bg-orange-950 text-orange-400 border-orange-800',
      icon: HardHat,
      name: 'Suresh Singhania',
      designation: 'Managing Director - Bharat Excavators Ltd',
      email: 'contact@bharatexcavators.com',
      password: 'CoalGuard@2026',
      description: 'Worker biometric shift log, heavy equipment operator safety compliance, contract status & assigned CAPA responses.',
    },
  ];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        onClose();
      } else {
        setError('Invalid credentials. Please check email and password.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleLogin = async (roleEmail: string, roleId: string) => {
    setSelectedRoleCard(roleId);
    setEmail(roleEmail);
    setPassword('CoalGuard@2026');
    setError(null);
    setLoading(true);

    try {
      const success = await login(roleEmail, 'CoalGuard@2026');
      if (success) {
        onClose();
      } else {
        setError('Role authentication failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Role login failed.');
    } finally {
      setLoading(false);
      setSelectedRoleCard(null);
    }
  };

  const fillFormFields = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('CoalGuard@2026');
    setCopiedEmail(roleEmail);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-6 flex flex-col md:flex-row">
        {/* Left Side: Role Selector Cards */}
        <div className="p-6 md:p-8 md:w-7/12 space-y-5 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Cpu className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <span className="font-extrabold text-base text-white tracking-wider">
                COAL-GUARD <span className="text-amber-400">AI</span>
              </span>
            </div>
            <h2 className="text-lg font-black text-white">Select Role Persona to Sign In</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any of the 5 roles below for instant single-click demo login, or type credentials manually.
            </p>
          </div>

          <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
            {demoRoles.map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRoleCard === r.id;
              const isCurrentActive = user?.email === r.email;
              return (
                <div
                  key={r.id}
                  onClick={() => handleQuickRoleLogin(r.email, r.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
                    isCurrentActive
                      ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/50'
                      : isSelected
                      ? 'bg-slate-950 border-amber-500'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-amber-400 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-2">
                          {r.title}
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${r.badgeColor}`}>
                            {r.badge}
                          </span>
                          {isCurrentActive && (
                            <span className="text-[9px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800 font-bold">
                              ACTIVE SESSION
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-300 mt-0.5">{r.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Email: <span className="text-amber-400">{r.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fillFormFields(r.email);
                        }}
                        className="p-1 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-all text-[10px] flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1"
                        title="Fill into manual login form"
                      >
                        {copiedEmail === r.email ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Fill
                      </button>
                      {loading && isSelected ? (
                        <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-slate-500 hover:text-amber-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Credentials & Manual Form */}
        <div className="p-6 md:p-8 md:w-5/12 bg-slate-900 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" /> Credentials Sign In
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Session Info Card */}
          {user && (
            <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Currently Logged In</span>
                <span className="font-bold text-xs text-white">{user.name}</span>
                <span className="text-[10px] text-slate-400 block">{user.email}</span>
              </div>
              <button
                onClick={() => logout()}
                className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-950/80 border border-red-800 text-red-300 p-3.5 rounded-xl text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Official Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@coalguard.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Password</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                All Demo Accounts Password: <span className="font-mono text-amber-400 font-bold">CoalGuard@2026</span>
              </p>
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
                  <UserCheck className="w-4 h-4" /> Sign In to COAL-GUARD AI
                </>
              )}
            </button>
          </form>

          {/* Quick Credentials Summary Card */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[10px]">
            <div className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Key className="w-3 h-3 text-amber-400" /> Credentials Cheatsheet
            </div>
            <div className="text-slate-400 space-y-0.5 font-mono">
              <div>• Admin: <span className="text-slate-200">admin@coalguard.gov.in</span></div>
              <div>• Mine GM: <span className="text-slate-200">gm.sonepur@ecl.coalindia.in</span></div>
              <div>• Inspector: <span className="text-slate-200">inspector.singh@dgms.gov.in</span></div>
              <div>• CPCB: <span className="text-slate-200">regulatory.cpcb@gov.in</span></div>
              <div>• Contractor: <span className="text-slate-200">contact@bharatexcavators.com</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
