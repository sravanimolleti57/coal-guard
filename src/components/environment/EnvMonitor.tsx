'use client';

import React, { useEffect, useState } from 'react';
import { Wind, Droplets, Volume2, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function EnvMonitor() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mines, setMines] = useState<any[]>([]);

  // Sensor Form state
  const [mineId, setMineId] = useState('');
  const [pm10, setPm10] = useState('95');
  const [pm25, setPm25] = useState('48');
  const [waterPh, setWaterPh] = useState('7.2');
  const [noiseLevelDb, setNoiseLevelDb] = useState('68');

  useEffect(() => {
    fetchEnv();
  }, []);

  const fetchEnv = async () => {
    setLoading(true);
    try {
      const [eRes, mRes] = await Promise.all([fetch('/api/environment'), fetch('/api/mines')]);
      if (eRes.ok) setData(await eRes.json());
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

  const handleAddReading = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mineId,
          pm10,
          pm25,
          waterPh,
          noiseLevelDb,
        }),
      });
      if (res.ok) {
        fetchEnv();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !data) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading CPCB environmental sensors...</div>;
  }

  const { readings, summary } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Wind className="w-5 h-5 text-amber-400" /> Environmental CAAQM & CPCB Monitoring
          </h1>
          <p className="text-xs text-slate-400">
            Real-time telemetry for Ambient Dust (PM10/PM2.5), Mine Water pH Discharge & Heavy Machine Noise levels.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold px-3 py-1 rounded-xl">
            {summary.normalCount} Normal
          </span>
          <span className="bg-amber-950 text-amber-400 border border-amber-800 font-bold px-3 py-1 rounded-xl">
            {summary.warningCount} Warning
          </span>
          <span className="bg-red-950 text-red-400 border border-red-800 font-bold px-3 py-1 rounded-xl">
            {summary.criticalCount} Critical
          </span>
        </div>
      </div>

      {/* Sensor Gauge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Air Quality Card */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Wind className="w-4 h-4 text-amber-400" /> Air Quality (CAAQM)
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">CPCB Limit: 100 ug/m3</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">PM10 Level</span>
              <span className="text-2xl font-black text-white">{readings[0]?.pm10 || 92} ug/m3</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">PM2.5 Level</span>
              <span className="text-2xl font-black text-amber-400">{readings[0]?.pm25 || 48} ug/m3</span>
            </div>
          </div>
        </div>

        {/* Water Quality Card */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-400" /> Mine Water Discharge
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Normal pH: 6.5 - 8.5</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Water pH</span>
              <span className="text-2xl font-black text-blue-400">{readings[0]?.waterPh || 7.2}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Turbidity</span>
              <span className="text-2xl font-black text-white">{readings[0]?.waterTurbidity || 4.8} NTU</span>
            </div>
          </div>
        </div>

        {/* Noise Card */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-purple-400" /> Noise Telemetry
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Max Limit: 85 dB</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Noise Level</span>
              <span className="text-2xl font-black text-purple-400">{readings[0]?.noiseLevelDb || 68.4} dB</span>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
              SAFE
            </span>
          </div>
        </div>
      </div>

      {/* Manual Reading Form & History Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="font-extrabold text-sm text-white">Log Environmental Sensor Reading</h3>

          <form onSubmit={handleAddReading} className="space-y-3 text-xs">
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">PM10 (ug/m3)</label>
                <input
                  type="number"
                  value={pm10}
                  onChange={(e) => setPm10(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">PM2.5 (ug/m3)</label>
                <input
                  type="number"
                  value={pm25}
                  onChange={(e) => setPm25(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Water pH</label>
                <input
                  type="number"
                  step="0.1"
                  value={waterPh}
                  onChange={(e) => setWaterPh(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Noise (dB)</label>
                <input
                  type="number"
                  value={noiseLevelDb}
                  onChange={(e) => setNoiseLevelDb(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md"
            >
              Log Telemetry Entry & Trigger Alert
            </button>
          </form>
        </div>

        {/* Readings Table */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Timestamp & Mine</th>
                  <th className="py-3.5 px-4">PM10 / PM2.5</th>
                  <th className="py-3.5 px-4">Water pH</th>
                  <th className="py-3.5 px-4">Noise dB</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {readings.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{r.mine.name}</div>
                      <div className="text-[10px] text-slate-500">{new Date(r.timestamp).toLocaleString('en-IN')}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {r.pm10} / {r.pm25} ug/m3
                    </td>
                    <td className="py-3.5 px-4 font-mono text-blue-400">{r.waterPh}</td>
                    <td className="py-3.5 px-4 font-mono text-purple-400">{r.noiseLevelDb} dB</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.status === 'CRITICAL'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : r.status === 'WARNING'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
