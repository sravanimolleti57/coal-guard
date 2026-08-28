'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Wind,
  HardHat,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  FileCheck,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface CorporateDashboardProps {
  onNavigate: (tab: string, meta?: any) => void;
}

export default function CorporateDashboard({ onNavigate }: CorporateDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<string>('ALL');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedSubsidiary]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let url = '/api/dashboard';
      if (selectedSubsidiary !== 'ALL') {
        url += `?subsidiaryId=${selectedSubsidiary}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-medium">Loading Governance & Risk Analytics...</p>
      </div>
    );
  }

  const { metrics, charts, recentAlerts } = data;

  const COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Top Banner & Subsidiary Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Executive Coal Governance Dashboard</h1>
            <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">
              Live Monitoring
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time compliance tracking, statutory DGMS audits, environmental alerts & risk scoring across Coal India subsidiaries.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">Subsidiary Filter:</label>
          <select
            value={selectedSubsidiary}
            onChange={(e) => setSelectedSubsidiary(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="ALL">All Subsidiaries (ECL, BCCL, CCL)</option>
            <option value="ECL">Eastern Coalfields Ltd (ECL)</option>
            <option value="BCCL">Bharat Coking Coal Ltd (BCCL)</option>
            <option value="CCL">Central Coalfields Ltd (CCL)</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Compliance % */}
        <div
          onClick={() => onNavigate('compliance')}
          className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all hover:scale-[1.01] shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Compliance</span>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">{metrics.overallCompliancePct}%</div>
            <div className="text-[11px] text-amber-400 font-medium mt-1 flex items-center gap-1">
              <span>{metrics.overdueComplianceCount} Overdue Requirements</span>
            </div>
          </div>
        </div>

        {/* Card 2: High Risk Mines */}
        <div
          onClick={() => onNavigate('risk')}
          className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 hover:border-red-500/50 cursor-pointer transition-all hover:scale-[1.01] shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High Risk Mines</span>
            <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl group-hover:bg-red-500 group-hover:text-slate-950 transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">{metrics.highRiskMinesCount}</div>
            <div className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
              <span>{metrics.criticalViolationsCount} Critical Safety Breach(es)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Corrective Actions */}
        <div
          onClick={() => onNavigate('violations')}
          className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all hover:scale-[1.01] shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open CAPA Actions</span>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl group-hover:bg-blue-500 group-hover:text-slate-950 transition-colors">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">{metrics.openCapas}</div>
            <div className="text-[11px] text-blue-400 font-medium mt-1 flex items-center gap-1">
              <span>{metrics.overdueCapas} Overdue Escalated CAPAs</span>
            </div>
          </div>
        </div>

        {/* Card 4: Production Achievement */}
        <div
          onClick={() => onNavigate('production')}
          className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all hover:scale-[1.01] shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Production Output</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">{metrics.productionAchievedPct}%</div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Target: {(metrics.totalTargetTonnage / 1000).toFixed(1)}k Tonnes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Tonnage Target vs Actual */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Production Target vs Actual Tonnage
              </h3>
              <p className="text-[11px] text-slate-400">Daily coal extraction output across active seams</p>
            </div>
            <button
              onClick={() => onNavigate('production')}
              className="text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1"
            >
              View Log <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.productionRecords} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="target" name="Target (Tonnes)" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual (Tonnes)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Violations by Category */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Safety & Compliance Violations Breakdown
              </h3>
              <p className="text-[11px] text-slate-400">Categorized by DGMS, CPCB & Statutory rules</p>
            </div>
            <button
              onClick={() => onNavigate('violations')}
              className="text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1"
            >
              View Violations <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.violationsByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="category"
                  label={({ name, value }: any) => `${name}: ${value}`}
                >
                  {charts.violationsByCategory.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Drill-down Hierarchy Tree: Subsidiary -> Region -> Mine -> Zone */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" /> Multi-Mine Governance Hierarchy Tree
            </h3>
            <p className="text-xs text-slate-400">
              Drill-down: Subsidiary → Region → Mine → Zone → Inspection findings
            </p>
          </div>
          <button
            onClick={() => onNavigate('mines')}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md"
          >
            Manage Mines
          </button>
        </div>

        {/* Tree Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ECL */}
          <div
            onClick={() => onNavigate('mines')}
            className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-white">Eastern Coalfields (ECL)</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                3 Active Mines
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Raniganj & Mugma Coalfield Pits</p>
            <div className="mt-3 text-xs text-slate-300 font-medium space-y-1">
              <div>• Sonepur Bazari Opencast Project (SBN-OCP-01)</div>
              <div>• Mugma Underground Colliery (MUG-UG-06)</div>
              <div>• Kusmunda Super Opencast Mine (KUS-SOCP-07)</div>
            </div>
          </div>

          {/* BCCL */}
          <div
            onClick={() => onNavigate('mines')}
            className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-white">Bharat Coking Coal (BCCL)</span>
              <span className="text-[10px] bg-purple-950 text-purple-400 px-2 py-0.5 rounded border border-purple-800">
                2 Active Mines
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Jharia Prime Coking Seams</p>
            <div className="mt-3 text-xs text-slate-300 font-medium space-y-1">
              <div>• Jharia Prime Coking Mine 4 (JHA-PCM-04)</div>
              <div>• Katas Opencast Project (KAT-OCP-08)</div>
            </div>
          </div>

          {/* CCL */}
          <div
            onClick={() => onNavigate('mines')}
            className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-white">Central Coalfields (CCL)</span>
              <span className="text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800">
                3 Active Mines
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">North Karanpura & Ramgarh Pits</p>
            <div className="mt-3 text-xs text-slate-300 font-medium space-y-1">
              <div>• Rajrappa Opencast Mine (RJP-OCP-02) [CRITICAL]</div>
              <div>• Piparwar Opencast Project (PIP-OCP-05)</div>
              <div>• Kathara Coal Washery & Pit (KTH-CWP-09)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
