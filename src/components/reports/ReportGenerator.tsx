'use client';

import React, { useState } from 'react';
import { FileBarChart, Download, Printer, Filter, Calendar, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ReportGenerator() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('compliance');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${reportType}`);
      if (res.ok) {
        setReportData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!reportData || !reportData.data) return;
    const jsonStr = JSON.stringify(reportData.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coal_guard_report_${reportType}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-amber-400" /> Statutory Report Generator & Exporter
          </h1>
          <p className="text-xs text-slate-400">
            Generate formal DGMS, CPCB & Corporate Governance reports formatted for print, PDF & CSV exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={!reportData}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export Report (JSON/CSV)
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Report Configuration Parameters</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Report Module</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="compliance">Statutory DGMS Compliance Report</option>
              <option value="inspections">Field Safety Inspections Log</option>
              <option value="violations">Safety Violations & CAPA Report</option>
              <option value="contractors">Contractor Safety & Compliance Audit</option>
              <option value="production">Production & Variance Report</option>
              <option value="environment">CPCB Environmental Telemetry Report</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-all"
            >
              {loading ? 'Generating...' : 'Generate Report Preview'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview Display */}
      {reportData && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <div>
              <span className="font-extrabold text-white text-sm uppercase">
                Coal India Statutory {reportData.type} Report
              </span>
              <div className="text-[10px] text-slate-400">
                Generated at: {new Date(reportData.generatedAt).toLocaleString('en-IN')} | Records: {reportData.recordCount}
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-96 overflow-y-auto font-mono text-[11px] text-emerald-400">
            <pre>{JSON.stringify(reportData.data, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
