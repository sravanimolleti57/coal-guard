'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle, Clock, CheckCircle2, Filter, FileText, Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ComplianceMatrix() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchComplianceData();
  }, [selectedCategory, selectedStatus]);

  const fetchComplianceData = async () => {
    setLoading(true);
    try {
      let url = '/api/compliance?';
      if (selectedCategory !== 'ALL') url += `categoryId=${selectedCategory}&`;
      if (selectedStatus !== 'ALL') url += `status=${selectedStatus}&`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/compliance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        fetchComplianceData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">Loading statutory compliance matrix...</p>
      </div>
    );
  }

  const { compliances, categories, summary } = data;

  const statusBadge = (st: string) => {
    switch (st) {
      case 'COMPLIANT':
        return <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">COMPLIANT</span>;
      case 'DUE_SOON':
        return <span className="bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">DUE SOON</span>;
      case 'OVERDUE':
        return <span className="bg-red-950 text-red-400 border border-red-800 text-[10px] font-bold px-2 py-0.5 rounded">OVERDUE</span>;
      case 'UNDER_REVIEW':
        return <span className="bg-purple-950 text-purple-400 border border-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">UNDER REVIEW</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded">{st}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Automated Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-r from-slate-900 to-amber-950/30 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl font-black text-white">DGMS & Statutory Compliance Matrix</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Automated compliance engine tracking Coal Mines Regulations 2017, Mines Act 1952, and CPCB environmental clearances.
            </p>
          </div>

          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block">Total Requirements</span>
              <span className="text-base font-extrabold text-white">{summary.total}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Compliant</span>
              <span className="text-base font-extrabold text-emerald-400">{summary.completed}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Due Soon</span>
              <span className="text-base font-extrabold text-amber-400">{summary.dueSoon}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Overdue</span>
              <span className="text-base font-extrabold text-red-400">{summary.overdue}</span>
            </div>
          </div>
        </div>

        {/* Compliance Score Widget Formula Card */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Automated Compliance Score</span>
          <div className="text-5xl font-black text-amber-400 my-2">{summary.complianceScore}%</div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden my-2 border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-500"
              style={{ width: `${summary.complianceScore}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Score = (Completed / Total Applicable) × 100
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Filter className="w-4 h-4 text-amber-400" /> Filter Compliance Items:
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white text-xs font-semibold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLIANT">COMPLIANT</option>
            <option value="DUE_SOON">DUE SOON</option>
            <option value="OVERDUE">OVERDUE</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
          </select>
        </div>
      </div>

      {/* Compliance Items Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Statutory Requirement</th>
                <th className="py-3.5 px-4">Mine & Category</th>
                <th className="py-3.5 px-4">Frequency</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {compliances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No compliance records match the selected criteria.
                  </td>
                </tr>
              ) : (
                compliances.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{c.requirement.title}</div>
                      <div className="text-[10px] text-amber-400/90 font-mono mt-0.5">{c.requirement.code}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{c.mine.name}</div>
                      <div className="text-[10px] text-slate-400">{c.requirement.category.name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                        {c.requirement.frequency}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-mono">{new Date(c.dueDate).toLocaleDateString('en-IN')}</div>
                    </td>
                    <td className="py-3.5 px-4">{statusBadge(c.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      {c.status !== 'COMPLIANT' && (
                        <button
                          onClick={() => handleUpdateStatus(c.id, 'COMPLIANT')}
                          className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 text-xs font-bold rounded-lg border border-emerald-500/30 transition-all"
                        >
                          Mark Compliant
                        </button>
                      )}
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
