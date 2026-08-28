'use client';

import React, { useEffect, useState } from 'react';
import {
  FileBarChart,
  Download,
  Printer,
  Filter,
  Calendar,
  Building2,
  Database,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Eye,
  FileCode,
  Table,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ReportGenerator() {
  const { user, token } = useAuth();
  const [reportType, setReportType] = useState('compliance');
  const [targetMineId, setTargetMineId] = useState('ALL');
  const [notes, setNotes] = useState('');
  const [mines, setMines] = useState<any[]>([]);

  // State Management
  const [reportData, setReportData] = useState<any | null>(null);
  const [pastReports, setPastReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [isMongoDb, setIsMongoDb] = useState(true);
  const [activeView, setActiveView] = useState<'table' | 'json'>('table');
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchMines();
    fetchReportsHistory();
  }, []);

  const fetchMines = async () => {
    try {
      const res = await fetch('/api/mines');
      if (res.ok) {
        const data = await res.json();
        setMines(data.mines || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReportsHistory = async () => {
    setFetchingHistory(true);
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setPastReports(data.reports || []);
        setIsMongoDb(data.isMongoDbConnected !== false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingHistory(false);
    }
  };

  // Generate Report & Store in MongoDB
  const handleGenerate = async () => {
    setLoading(true);
    setStatusFeedback(null);

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          moduleType: reportType,
          mineId: targetMineId,
          notes,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setReportData(result.report);
        setIsMongoDb(result.isMongoDbConnected !== false);
        setStatusFeedback({
          type: 'success',
          message: `Statutory report "${result.report.title}" generated & saved to MongoDB (${result.report.reportId})!`,
        });
        fetchReportsHistory();
      } else {
        const err = await res.json();
        setStatusFeedback({
          type: 'error',
          message: err.error || 'Failed to generate statutory report.',
        });
      }
    } catch (e: any) {
      setStatusFeedback({
        type: 'error',
        message: e.message || 'Error generating report. Check connection.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Export Report as JSON File
  const handleExportJson = (reportObj?: any) => {
    const target = reportObj || reportData;
    if (!target) return;

    const jsonStr = JSON.stringify(target, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${target.reportId || 'coal_guard_report'}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Export Report as CSV File
  const handleExportCsv = (reportObj?: any) => {
    const target = reportObj || reportData;
    if (!target || !target.data || !Array.isArray(target.data) || target.data.length === 0) {
      alert('No tabular data available for CSV export.');
      return;
    }

    const rows = target.data;
    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(',')];

    rows.forEach((row: any) => {
      const line = headers
        .map((h) => {
          const val = row[h] !== undefined && row[h] !== null ? String(row[h]).replace(/"/g, '""') : '';
          return `"${val}"`;
        })
        .join(',');
      csvLines.push(line);
    });

    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${target.reportId || 'coal_guard_report'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-amber-400" /> Statutory Report Generator & Exporter
          </h1>
          <p className="text-xs text-slate-400">
            Generate formal DGMS, CPCB & Corporate Governance reports formatted for print, PDF, JSON & CSV exports.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleExportCsv()}
            disabled={!reportData}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-50 transition-all"
            title="Export generated report as CSV"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

          <button
            onClick={() => handleExportJson()}
            disabled={!reportData}
            className="px-3.5 py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-50 transition-all"
            title="Export generated report as JSON"
          >
            <FileCode className="w-4 h-4" /> Export JSON
          </button>
        </div>
      </div>

      {/* Loading & Status Toast Feedback */}
      {statusFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-lg animate-fade-in ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
              : 'bg-red-950/60 border-red-700 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{statusFeedback.message}</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
            {isMongoDb ? '● MONGODB CONNECTED' : '● IN-MEMORY FALLBACK'}
          </span>
        </div>
      )}

      {/* Filter Controls Card */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400" /> Report Configuration Parameters
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">MongoDB Collection: <code className="text-amber-400 font-bold">coalguard.reports</code></span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Report Module Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Report Module *</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            >
              <option value="compliance">Statutory DGMS Compliance Report</option>
              <option value="inspections">Field Safety Inspections Log</option>
              <option value="violations">Safety Violations & CAPA Report</option>
              <option value="contractors">Contractor Safety & Compliance Audit</option>
              <option value="production">Production & Variance Report</option>
              <option value="environment">CPCB Environmental Telemetry Report</option>
            </select>
          </div>

          {/* Target Mine Site Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Target Mine Site</label>
            <select
              value={targetMineId}
              onChange={(e) => setTargetMineId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            >
              <option value="ALL">All Subsidiary Operations</option>
              {mines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.code})
                </option>
              ))}
            </select>
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" /> Generating & Saving to MongoDB...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate Report Preview
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Report Preview Display */}
      {reportData && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5 shadow-2xl animate-fade-in">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded border border-amber-800 font-bold uppercase">
                {reportData.reportId}
              </span>
              <h2 className="text-lg font-black text-white mt-1">{reportData.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generated By: <strong className="text-slate-200">{reportData.generatedBy}</strong> • Site: <strong className="text-slate-200">{reportData.mineName}</strong> • Generated At: <span className="font-mono text-amber-300">{new Date(reportData.generatedAt).toLocaleString('en-IN')}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  activeView === 'table' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" /> Table View
              </button>
              <button
                onClick={() => setActiveView('json')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  activeView === 'json' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" /> Raw JSON View
              </button>
            </div>
          </div>

          {/* Executive Summary Metrics Grid */}
          {reportData.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              {Object.entries(reportData.summary).map(([key, val]: any) => (
                <div key={key} className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-sm font-black text-amber-400 block">{String(val)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Content View: Table vs JSON */}
          {activeView === 'table' ? (
            <div className="overflow-x-auto bg-slate-950 rounded-xl border border-slate-800">
              {Array.isArray(reportData.data) && reportData.data.length > 0 ? (
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead className="bg-slate-900 text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      {Object.keys(reportData.data[0]).map((h) => (
                        <th key={h} className="py-3 px-4 capitalize">
                          {h.replace(/([A-Z])/g, ' $1')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {reportData.data.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                        {Object.keys(row).map((k) => (
                          <td key={k} className="py-3 px-4">
                            {typeof row[k] === 'object' && row[k] !== null ? (
                              JSON.stringify(row[k])
                            ) : k.toLowerCase().includes('status') ? (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                  String(row[k]).includes('COMPLIANT') || String(row[k]).includes('NORMAL') || String(row[k]).includes('GOOD')
                                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                    : 'bg-amber-950 text-amber-400 border-amber-800'
                                }`}
                              >
                                {String(row[k])}
                              </span>
                            ) : (
                              String(row[k])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs">No tabular record data available for this report parameters.</div>
              )}
            </div>
          ) : (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-96 overflow-y-auto font-mono text-[11px] text-emerald-400">
              <pre>{JSON.stringify(reportData, null, 2)}</pre>
            </div>
          )}

          {/* Export Action Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-400 font-mono text-[10px]">
              MongoDB Collection: <code className="text-amber-400">coalguard.reports</code> | Total Records: <strong>{reportData.recordCount}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportCsv()}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download CSV
              </button>
              <button
                onClick={() => handleExportJson()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl shadow flex items-center gap-1.5"
              >
                <FileCode className="w-4 h-4" /> Download JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MongoDB Stored Reports History Table */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" /> Stored Reports History (MongoDB)
            </h3>
            <p className="text-[11px] text-slate-400">Historical statutory reports persisted in MongoDB database.</p>
          </div>
          <button
            onClick={fetchReportsHistory}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
            title="Refresh MongoDB Reports List"
          >
            <RotateCw className={`w-4 h-4 ${fetchingHistory ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Report ID & Title</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Generated By</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-center">Records</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {pastReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                    No generated reports saved in MongoDB database yet. Click "Generate Report Preview" above to create a report!
                  </td>
                </tr>
              ) : (
                pastReports.map((rpt) => (
                  <tr key={rpt.reportId || rpt._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs">{rpt.title}</div>
                      <div className="text-[10px] font-mono text-amber-400">{rpt.reportId}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300 uppercase">{rpt.moduleType}</td>
                    <td className="py-3 px-4 text-slate-300">{rpt.generatedBy}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{new Date(rpt.generatedAt).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400 text-center">{rpt.recordCount}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setReportData(rpt)}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-lg border border-amber-500/40 text-[10px] flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Preview
                        </button>
                        <button
                          onClick={() => handleExportCsv(rpt)}
                          className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 font-bold rounded-lg border border-emerald-800 text-[10px]"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => handleExportJson(rpt)}
                          className="px-2 py-1 bg-blue-950 hover:bg-blue-900 text-blue-400 font-bold rounded-lg border border-blue-800 text-[10px]"
                        >
                          JSON
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
