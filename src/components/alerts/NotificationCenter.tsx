'use client';

import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Wind, ShieldAlert, FileText, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function NotificationCenter() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let url = '/api/alerts';
      if (filter !== 'ALL') url += `?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setAlerts(json.alerts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" /> Centralized Alert & Notification Center
          </h1>
          <p className="text-xs text-slate-400">
            Real-time statutory notifications for DGMS compliance, critical safety violations & environmental threshold spikes.
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5"
        >
          <Check className="w-4 h-4" /> Mark All Read
        </button>
      </div>

      {/* Alerts List */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl p-4 space-y-3">
        {alerts.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center">No notifications found.</p>
        ) : (
          alerts.map((alt) => (
            <div
              key={alt.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                alt.severity === 'CRITICAL'
                  ? 'bg-red-950/20 border-red-800/40 text-red-100'
                  : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white">{alt.title}</span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      alt.severity === 'CRITICAL' ? 'bg-red-950 text-red-400' : 'bg-amber-950 text-amber-400'
                    }`}
                  >
                    {alt.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{alt.message}</p>
                <div className="text-[10px] text-slate-500 font-mono">
                  {alt.mine?.name || 'System-wide'} • {new Date(alt.createdAt).toLocaleString('en-IN')}
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  alt.status === 'UNREAD' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {alt.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
