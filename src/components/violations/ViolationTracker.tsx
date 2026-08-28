'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, FileCheck, ShieldAlert, ArrowUpRight, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ViolationTracker() {
  const { user } = useAuth();
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedViolation, setSelectedViolation] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // CAPA Action Modal Form state
  const [timelineNote, setTimelineNote] = useState('');
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');

  useEffect(() => {
    fetchViolations();
  }, [statusFilter]);

  const fetchViolations = async () => {
    setLoading(true);
    try {
      let url = '/api/violations';
      if (statusFilter !== 'ALL') url += `?status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const vList = json.violations || [];
        setViolations(vList);
        if (vList.length > 0 && !selectedViolation) {
          setSelectedViolation(vList[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCapa = async (capaId: string, status: string, escalationLevel?: number) => {
    try {
      const res = await fetch('/api/corrective-actions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: capaId,
          status,
          note: timelineNote || `Updated status to ${status}`,
          escalationLevel,
        }),
      });

      if (res.ok) {
        setTimelineNote('');
        fetchViolations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const severityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="bg-red-950 text-red-400 border border-red-800 text-[10px] font-bold px-2 py-0.5 rounded">CRITICAL</span>;
      case 'HIGH':
        return <span className="bg-orange-950 text-orange-400 border border-orange-800 text-[10px] font-bold px-2 py-0.5 rounded">HIGH</span>;
      default:
        return <span className="bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">{sev}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" /> Violations & Corrective Action (CAPA) Tracker
          </h1>
          <p className="text-xs text-slate-400">
            End-to-end statutory breach lifecycle tracking, assigned engineering owners, evidence proof & automated escalation levels.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-white text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="ASSIGNED">ASSIGNED</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="AWAITING_VERIFICATION">AWAITING VERIFICATION</option>
          <option value="CLOSED">CLOSED</option>
          <option value="ESCALATED">ESCALATED</option>
        </select>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Violation List */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
            Violations ({violations.length})
          </h3>

          {loading ? (
            <p className="text-xs text-slate-500 py-4">Loading violations...</p>
          ) : (
            violations.map((v) => {
              const isSelected = selectedViolation?.id === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedViolation(v)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-400">{v.violationNumber}</span>
                    {severityBadge(v.severity)}
                  </div>
                  <p className="text-xs text-slate-200 font-medium mt-2 line-clamp-2">{v.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80">
                    <span>{v.mine.name}</span>
                    <span className="text-amber-400 font-semibold">{v.status}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Violation & CAPA Detail + Activity Timeline */}
        <div className="lg:col-span-2">
          {selectedViolation ? (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-amber-400">{selectedViolation.violationNumber}</span>
                    {severityBadge(selectedViolation.severity)}
                  </div>
                  <h2 className="text-lg font-extrabold text-white mt-1">{selectedViolation.mine.name}</h2>
                  <p className="text-xs text-slate-400 mt-1">{selectedViolation.description}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Statutory Status</span>
                  <span className="text-xs font-bold px-2.5 py-1 bg-amber-950 text-amber-400 rounded-full border border-amber-800">
                    {selectedViolation.status}
                  </span>
                </div>
              </div>

              {/* CAPA Plan Cards */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-amber-400" /> Assigned Corrective Action Plan (CAPA)
                </h4>

                {selectedViolation.correctiveActions?.map((capa: any) => (
                  <div key={capa.id} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-sm text-white">{capa.title}</h5>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 text-amber-400 rounded border border-slate-800">
                        {capa.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{capa.description}</p>

                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-900">
                      <div>Owner: <span className="text-white font-semibold">{capa.assignedTo?.name || 'Mine Manager'}</span></div>
                      <div>Deadline: <span className="text-amber-400 font-mono font-semibold">{new Date(capa.deadline).toLocaleDateString('en-IN')}</span></div>
                      <div>Escalation: <span className="text-red-400 font-semibold">Level {capa.escalationLevel}</span></div>
                    </div>

                    {/* Timeline Log */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block">
                        Action Activity Timeline
                      </span>
                      <div className="space-y-2 border-l-2 border-slate-800 pl-3">
                        {capa.timelines?.map((t: any) => (
                          <div key={t.id} className="text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{t.status}</span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(t.timestamp).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <p className="text-slate-400 text-[11px]">{t.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons for Updating CAPA */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-900">
                      <input
                        type="text"
                        placeholder="Add progress note or verification proof..."
                        value={timelineNote}
                        onChange={(e) => setTimelineNote(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 text-xs text-white px-3 py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        onClick={() => handleUpdateCapa(capa.id, 'IN_PROGRESS')}
                        className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 text-blue-400 font-bold text-xs rounded-lg border border-blue-800"
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => handleUpdateCapa(capa.id, 'VERIFIED_CLOSED')}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold text-xs rounded-lg border border-emerald-500/30"
                      >
                        Verify & Close
                      </button>
                      <button
                        onClick={() => handleUpdateCapa(capa.id, 'ESCALATED', (capa.escalationLevel || 0) + 1)}
                        className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-400 font-bold text-xs rounded-lg border border-red-800"
                      >
                        Escalate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
              Select a violation to view CAPA action plan & timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
