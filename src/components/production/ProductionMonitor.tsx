'use client';

import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, AlertTriangle, Clock, Plus, BarChart2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ProductionMonitor() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mines, setMines] = useState<any[]>([]);

  // Form state
  const [mineId, setMineId] = useState('');
  const [targetSeam, setTargetSeam] = useState('Seam IV - Open Pit');
  const [targetTonnage, setTargetTonnage] = useState('35000');
  const [actualTonnage, setActualTonnage] = useState('33500');
  const [downtimeHours, setDowntimeHours] = useState('1.5');
  const [downtimeReason, setDowntimeReason] = useState('Routine Belt Conveyor Inspection');

  useEffect(() => {
    fetchProduction();
  }, []);

  const fetchProduction = async () => {
    setLoading(true);
    try {
      const [pRes, mRes] = await Promise.all([fetch('/api/production'), fetch('/api/mines')]);
      if (pRes.ok) setData(await pRes.json());
      if (mRes.ok) {
        const mList = (await mRes.json()).mines || [];
        setMines(mList);
        if (mList.length > 0) setMineId(mList[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mineId,
          targetSeam,
          targetTonnage,
          actualTonnage,
          downtimeHours,
          downtimeReason,
        }),
      });
      if (res.ok) {
        fetchProduction();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !data) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading production logs...</div>;
  }

  const { records, summary, anomalies } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" /> Coal Production & Tonnage Analytics
          </h1>
          <p className="text-xs text-slate-400">
            Daily seam extraction metrics, target achievement variance & equipment downtime tracking.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Target vs Actual</span>
            <span className="text-emerald-400 font-bold text-sm">{summary.achievementPct}% Achieved</span>
          </div>
        </div>
      </div>

      {/* Production Anomaly Alert Banner */}
      {anomalies && anomalies.length > 0 && (
        <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-extrabold text-xs">
            <AlertTriangle className="w-4 h-4" /> Production Variance Anomaly Insights
          </div>
          {anomalies.map((an: string, idx: number) => (
            <p key={idx} className="text-xs text-red-200">
              • {an}
            </p>
          ))}
        </div>
      )}

      {/* Log Form & Log Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-extrabold text-sm text-white">Log Daily Production Entry</h3>

          <form onSubmit={handleAddLog} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Mine</label>
              <select
                value={mineId}
                onChange={(e) => setMineId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500"
              >
                {mines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Target Seam</label>
              <input
                type="text"
                value={targetSeam}
                onChange={(e) => setTargetSeam(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target (Tonnes)</label>
                <input
                  type="number"
                  value={targetTonnage}
                  onChange={(e) => setTargetTonnage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Actual (Tonnes)</label>
                <input
                  type="number"
                  value={actualTonnage}
                  onChange={(e) => setActualTonnage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Downtime Reason (if any)</label>
              <input
                type="text"
                value={downtimeReason}
                onChange={(e) => setDowntimeReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md"
            >
              Submit Daily Tonnage Log
            </button>
          </form>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Date & Seam</th>
                  <th className="py-3.5 px-4">Mine</th>
                  <th className="py-3.5 px-4">Target Tonnage</th>
                  <th className="py-3.5 px-4">Actual Tonnage</th>
                  <th className="py-3.5 px-4">Downtime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {records.map((r: any) => {
                  const dev = ((r.actualTonnage - r.targetTonnage) / r.targetTonnage) * 100;
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{new Date(r.date).toLocaleDateString('en-IN')}</div>
                        <div className="text-[10px] text-slate-400">{r.targetSeam}</div>
                      </td>
                      <td className="py-3.5 px-4">{r.mine.name}</td>
                      <td className="py-3.5 px-4 font-mono">{r.targetTonnage.toLocaleString()} T</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {r.actualTonnage.toLocaleString()} T ({dev >= 0 ? `+${dev.toFixed(1)}%` : `${dev.toFixed(1)}%`})
                      </td>
                      <td className="py-3.5 px-4 text-[11px]">
                        <span className="text-amber-400 font-bold">{r.downtimeHours} hrs</span>
                        <div className="text-[10px] text-slate-500">{r.downtimeReason || 'None'}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
