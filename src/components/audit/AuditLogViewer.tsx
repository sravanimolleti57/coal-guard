'use client';

import React, { useEffect, useState } from 'react';
import { History, Shield, User, Filter } from 'lucide-react';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit');
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" /> Immutable System Audit Trail
          </h1>
          <p className="text-xs text-slate-400">
            Security event auditing recording user actions, status edits, statutory uploads & timestamp metadata.
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User & Role</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Module</th>
                <th className="py-3.5 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {logs.map((l: any) => (
                <tr key={l.id} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                    {new Date(l.timestamp).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{l.userName}</div>
                    <div className="text-[10px] text-amber-400">{l.role}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-amber-300">{l.action}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-950 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-800">
                      {l.module}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">{l.ipAddress || '127.0.0.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
