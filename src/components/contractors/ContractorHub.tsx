'use client';

import React, { useEffect, useState } from 'react';
import { HardHat, Users, ShieldAlert, Award, FileText, CheckCircle2, UserCheck, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ContractorHub() {
  const { user } = useAuth();
  const [contractors, setContractors] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'contractors' | 'attendance'>('contractors');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, aRes] = await Promise.all([fetch('/api/contractors'), fetch('/api/attendance')]);
      if (cRes.ok) setContractors((await cRes.json()).contractors || []);
      if (aRes.ok) setAttendances((await aRes.json()).attendances || []);
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
            <HardHat className="w-5 h-5 text-amber-400" /> Contractor & Worker Governance Hub
          </h1>
          <p className="text-xs text-slate-400">
            Monitor contractor risk scores, safety compliance ratings, active excavating contracts & worker biometric attendance.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('contractors')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'contractors' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Contractor Directory
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'attendance' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Worker Biometric Attendance
          </button>
        </div>
      </div>

      {activeTab === 'contractors' ? (
        /* Contractors Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contractors.map((c) => (
            <div key={c.id} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-white">{c.companyName}</h3>
                  <div className="text-xs text-amber-400 font-mono mt-0.5">{c.registrationNumber}</div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    c.status === 'ACTIVE'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {c.status}
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Worker Strength</span>
                  <span className="text-base font-black text-white">{c.workerCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Safety Compliance</span>
                  <span className="text-base font-black text-emerald-400">{c.complianceScore}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Risk Rating</span>
                  <span className={`text-base font-black ${c.riskScore > 50 ? 'text-red-400' : 'text-amber-400'}`}>
                    {c.riskScore}/100
                  </span>
                </div>
              </div>

              {/* Contact info */}
              <div className="text-xs text-slate-300 space-y-1">
                <div>Contact Person: <span className="font-semibold text-white">{c.contactPerson}</span></div>
                <div>Email: <span className="text-slate-400">{c.email}</span></div>
              </div>

              {/* Active Contracts */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Contracts</span>
                {c.contracts?.map((cnt: any) => (
                  <div key={cnt.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{cnt.title}</div>
                      <div className="text-[10px] text-slate-400">{cnt.mine.name} • INR {cnt.value} Lakhs</div>
                    </div>
                    <span className="text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded font-mono border border-amber-800">
                      {cnt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Attendance Table */
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-extrabold text-white">Biometric Shift Attendance Log</span>
            <span className="text-emerald-400 font-bold">Shift A / B / C Live Feed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Worker Code & Name</th>
                  <th className="py-3.5 px-4">Contractor</th>
                  <th className="py-3.5 px-4">Mine & Shift</th>
                  <th className="py-3.5 px-4">Check-In Time</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {attendances.map((att: any) => (
                  <tr key={att.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{att.worker.name}</div>
                      <div className="text-[10px] text-amber-400 font-mono">{att.worker.workerCode}</div>
                    </td>
                    <td className="py-3.5 px-4">{att.contractor.companyName}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{att.mine.name}</div>
                      <div className="text-[10px] text-slate-400">{att.shift}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                      {att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-800">
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
