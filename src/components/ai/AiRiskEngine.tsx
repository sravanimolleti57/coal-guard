'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, AlertTriangle, ShieldCheck, CheckCircle2, ArrowUpRight, Sparkles, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AiRiskEngine() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiskData();
  }, []);

  const fetchRiskData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/risk-engine');
      if (res.ok) {
        const json = await res.json();
        setEvaluations(json.evaluations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Executing AI Risk Evaluation Module...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-black text-white">AI Risk Engine & Anomaly Analytics</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic risk evaluation algorithm scoring mines (0–100) based on compliance %, violations, environmental telemetry & CAPA delays.
          </p>
        </div>

        <button
          onClick={fetchRiskData}
          className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4" /> Recalculate Risk Scores
        </button>
      </div>

      {/* Risk Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {evaluations.map((ev) => {
          const isCritical = ev.riskLevel === 'CRITICAL' || ev.riskLevel === 'HIGH';
          return (
            <div
              key={ev.mineId}
              className={`p-6 rounded-2xl border transition-all space-y-4 shadow-xl ${
                isCritical ? 'bg-slate-900 border-red-800/60' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white">{ev.mineName}</h3>
                    <span className="text-[10px] bg-slate-950 text-slate-400 font-mono px-2 py-0.5 rounded border border-slate-800">
                      {ev.mineCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{ev.subsidiary} Subsidiary</p>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-white">{ev.overallScore}/100</span>
                  <div
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded mt-1 ${
                      ev.riskLevel === 'CRITICAL'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : ev.riskLevel === 'HIGH'
                        ? 'bg-orange-950 text-orange-400 border border-orange-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {ev.riskLevel} RISK
                  </div>
                </div>
              </div>

              {/* Contributing Factors */}
              {ev.contributingFactors?.length > 0 && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                  <span className="text-[10px] text-amber-400 uppercase font-extrabold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Key Risk Drivers
                  </span>
                  {ev.contributingFactors.map((f: string, idx: number) => (
                    <div key={idx} className="text-slate-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actionable Recommendations */}
              {ev.recommendations?.length > 0 && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                  <span className="text-[10px] text-emerald-400 uppercase font-extrabold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> AI Recommended Action Plan
                  </span>
                  {ev.recommendations.map((r: string, idx: number) => (
                    <div key={idx} className="text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
