'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import LoginModal from '@/components/auth/LoginModal';
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  HardHat,
  Activity,
  Wind,
  FileText,
  MapPin,
  Cpu,
  Bot,
  Bell,
  FileBarChart,
  History,
  UserCog,
  LogOut,
  ChevronDown,
  Menu,
  X,
  CheckCircle2,
  Lock,
  UserCheck,
  LogIn,
} from 'lucide-react';

interface ShellProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export default function Shell({ activeTab, setActiveTab, children }: ShellProps) {
  const { user, logout, switchDemoRole, isLoginOpen, openLoginModal, closeLoginModal } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(3);
  const [alertsDrawerOpen, setAlertsDrawerOpen] = useState(false);
  const [alertsList, setAlertsList] = useState<any[]>([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setUnreadAlerts(data.unreadCount || 0);
        setAlertsList(data.alerts || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAlertsRead = async () => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setUnreadAlerts(0);
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'MINE_OFFICIAL', 'MANAGER', 'FIELD_INSPECTOR', 'REGULATORY_AUTHORITY', 'CONTRACTOR'] },
    { id: 'mines', label: 'Mine Operations', icon: Building2, roles: ['SUPER_ADMIN', 'ADMIN', 'MINE_OFFICIAL', 'MANAGER', 'REGULATORY_AUTHORITY'] },
    { id: 'compliance', label: 'Compliance Matrix', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'MINE_OFFICIAL', 'MANAGER', 'FIELD_INSPECTOR', 'REGULATORY_AUTHORITY', 'CONTRACTOR'] },
    { id: 'contractors', label: 'Contractors & Workers', icon: HardHat, roles: ['SUPER_ADMIN', 'ADMIN', 'MINE_OFFICIAL', 'MANAGER', 'CONTRACTOR'] },
    { id: 'production', label: 'Production Monitoring', icon: Activity, roles: ['SUPER_ADMIN', 'ADMIN', 'MINE_OFFICIAL', 'MANAGER', 'REGULATORY_AUTHORITY'] },
    { id: 'documents', label: 'Document Vault & OCR', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'MINE_OFFICIAL', 'MANAGER', 'REGULATORY_AUTHORITY', 'CONTRACTOR'] },
    { id: 'admin-documents', label: 'Admin Document Review', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'REGULATORY_AUTHORITY'] },
    { id: 'gis', label: 'GIS Mine Map', icon: MapPin, roles: ['SUPER_ADMIN', 'ADMIN', 'MINE_OFFICIAL', 'MANAGER', 'FIELD_INSPECTOR', 'REGULATORY_AUTHORITY'] },
    { id: 'ai-assistant', label: 'AI Governance Copilot', icon: Bot, roles: ['SUPER_ADMIN', 'ADMIN', 'MINE_OFFICIAL', 'MANAGER', 'FIELD_INSPECTOR', 'REGULATORY_AUTHORITY', 'CONTRACTOR'] },
    { id: 'alerts', label: 'Alert Center', icon: Bell, roles: ['SUPER_ADMIN', 'ADMIN', 'MINE_OFFICIAL', 'MANAGER', 'FIELD_INSPECTOR', 'REGULATORY_AUTHORITY', 'CONTRACTOR'] },
    { id: 'reports', label: 'Statutory Reports', icon: FileBarChart, roles: ['SUPER_ADMIN', 'ADMIN', 'MINE_OFFICIAL', 'MANAGER', 'REGULATORY_AUTHORITY'] },
    { id: 'audit', label: 'System Audit Trail', icon: History, roles: ['SUPER_ADMIN', 'ADMIN', 'REGULATORY_AUTHORITY'] },
    { id: 'users', label: 'Users & Roles', icon: UserCog, roles: ['SUPER_ADMIN', 'ADMIN'] },
  ];

  const filteredNav = navItems.filter((item) => user && item.roles.includes(user.role));

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-emerald-950/80 text-emerald-400 border-emerald-800',
    SUPER_ADMIN: 'bg-emerald-950/80 text-emerald-400 border-emerald-800',
    MANAGER: 'bg-blue-950/80 text-blue-400 border-blue-800',
    MINE_OFFICIAL: 'bg-blue-950/80 text-blue-400 border-blue-800',
    FIELD_INSPECTOR: 'bg-amber-950/80 text-amber-400 border-amber-800',
    REGULATORY_AUTHORITY: 'bg-purple-950/80 text-purple-400 border-purple-800',
    CONTRACTOR: 'bg-orange-950/80 text-orange-400 border-orange-800',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Login Modal */}
      <LoginModal isOpen={isLoginOpen} onClose={closeLoginModal} />

      {/* Top Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Cpu className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider text-white bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200">
                COAL-GUARD <span className="text-amber-500 text-xs px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-700/50">AI</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">Smart Mining Governance & Compliance</p>
            </div>
          </div>
        </div>

        {/* Global Role Controls & User Actions */}
        <div className="flex items-center gap-3 md:gap-4">

          {/* Notifications Drawer Bell */}
          <div className="relative">
            <button
              onClick={() => setAlertsDrawerOpen(!alertsDrawerOpen)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl relative transition-all border border-slate-700/50"
            >
              <Bell className="w-5 h-5" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white font-bold text-[11px] rounded-full flex items-center justify-center animate-pulse">
                  {unreadAlerts}
                </span>
              )}
            </button>

            {/* Notification Drawer Modal */}
            {alertsDrawerOpen && (
              <div className="absolute right-0 mt-3 w-80 md:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-sm text-white">Live System Alerts</h3>
                  </div>
                  {unreadAlerts > 0 && (
                    <button
                      onClick={markAlertsRead}
                      className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark All Read
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {alertsList.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No recent notifications</p>
                  ) : (
                    alertsList.map((alt) => (
                      <div
                        key={alt.id}
                        onClick={() => {
                          setAlertsDrawerOpen(false);
                          setActiveTab('alerts');
                        }}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          alt.severity === 'CRITICAL'
                            ? 'bg-red-950/30 border-red-800/50 text-red-200 hover:bg-red-900/40'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white">{alt.title}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(alt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-2">{alt.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active User Profile Info & Logout */}
          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="hidden lg:block text-right">
                <div className="font-semibold text-xs text-white flex items-center justify-end gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> {user.name}
                </div>
                <div className="text-[10px] text-slate-400">{user.designation || user.email}</div>
              </div>
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                  roleColors[user.role] || 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {user.role.replace('_', ' ')}
              </span>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-800 transition-all"
                title="Sign Out / Lock Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={`${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 transition-transform duration-200 ease-in-out fixed md:static inset-y-0 left-0 z-30 w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between pt-16 md:pt-0`}
        >
          <div className="p-3 space-y-1 overflow-y-auto flex-1">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Governance Modules
            </div>

            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 border border-amber-500/30 font-semibold shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Coal India DGMS Matrix</span>
                <span className="text-emerald-400">● Auth Token Active</span>
              </div>
              <button onClick={logout} className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
