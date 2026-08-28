'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, ShieldAlert, AlertTriangle, Layers, Navigation, ChevronRight, Activity, Wind } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function GisMap() {
  const { user } = useAuth();
  const [points, setPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null);

  useEffect(() => {
    fetchGis();
  }, []);

  const fetchGis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gis');
      if (res.ok) {
        const json = await res.json();
        const pList = json.points || [];
        setPoints(pList);
        if (pList.length > 0) setSelectedPoint(pList[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading GIS Map Telemetry...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-400" /> Interactive GIS Mine Risk & Environmental Map
          </h1>
          <p className="text-xs text-slate-400">
            OpenStreetMap & Leaflet GIS spatial telemetry for mine pits, highwall slopes, environmental monitoring points & risk heatmaps.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span className="text-slate-300 text-[11px]">Low Risk</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span className="text-slate-300 text-[11px]">Medium Risk</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500"></span><span className="text-slate-300 text-[11px]">High Risk</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="text-slate-300 text-[11px]">Critical Risk</span></div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Map Visual Box */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-4 relative min-h-[420px] flex flex-col justify-between overflow-hidden shadow-2xl">
          {/* Simulated GIS Spatial Canvas Map View with Coalfields Grid */}
          <div className="absolute inset-0 bg-slate-950 opacity-90 p-6 flex items-center justify-center pointer-events-none">
            {/* Grid overlay */}
            <div className="w-full h-full border border-slate-800/40 rounded-xl grid grid-cols-6 grid-rows-6">
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className="border border-slate-900/60"></div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800">
              Region: Eastern India Coalfields (ECL / BCCL / CCL)
            </span>
            <span className="bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800">
              Scale: 1:50,000 Spatial Resolution
            </span>
          </div>

          {/* Interactive Mine Location Pins */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 my-8">
            {points.map((pt) => {
              const isSelected = selectedPoint?.id === pt.id;
              return (
                <button
                  key={pt.id}
                  onClick={() => setSelectedPoint(pt)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500 shadow-xl ring-2 ring-amber-500/20'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: pt.statusColor }}></span>
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-300">
                      {pt.code}
                    </span>
                  </div>
                  <div className="font-extrabold text-xs text-white mt-2 truncate">{pt.name}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{pt.district}, {pt.state}</div>
                </button>
              );
            })}
          </div>

          <div className="relative z-10 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>© OpenStreetMap Contributors • Coal-Guard GIS Engine</span>
            <span>Click any mine marker to view spatial popup metrics</span>
          </div>
        </div>

        {/* Selected Mine GIS Popup Details */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5 shadow-xl">
          {selectedPoint ? (
            <>
              <div className="pb-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-400">{selectedPoint.code}</span>
                  <span
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded"
                    style={{ backgroundColor: `${selectedPoint.statusColor}20`, color: selectedPoint.statusColor, border: `1px solid ${selectedPoint.statusColor}40` }}
                  >
                    {selectedPoint.riskLevel} RISK ({selectedPoint.riskScore}/100)
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-1">{selectedPoint.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedPoint.subsidiary} • {selectedPoint.district}, {selectedPoint.state}</p>
              </div>

              {/* Coordinates */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 text-xs font-mono">
                <div className="text-slate-400 flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-amber-400" /> GPS Spatial Coordinates
                </div>
                <div className="text-emerald-400 font-bold text-sm">
                  {selectedPoint.latitude.toFixed(4)}° N, {selectedPoint.longitude.toFixed(4)}° E
                </div>
              </div>

              {/* Active Zones */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pit Zones Monitored</span>
                <div className="space-y-1.5">
                  {selectedPoint.zones?.map((z: any) => (
                    <div key={z.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-white font-medium">{z.name}</span>
                      <span className="text-[10px] text-amber-400 font-mono">{z.riskLevel}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sensor telemetry */}
              {selectedPoint.latestReading && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-amber-400" /> Live CAAQM Sensor Telemetry
                  </span>
                  <div className="flex items-center justify-between font-mono text-slate-300">
                    <span>PM10: <b className="text-amber-400">{selectedPoint.latestReading.pm10} ug/m3</b></span>
                    <span>Noise: <b className="text-purple-400">{selectedPoint.latestReading.noiseLevelDb} dB</b></span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">Select a mine marker to view spatial telemetry.</p>
          )}
        </div>
      </div>
    </div>
  );
}
