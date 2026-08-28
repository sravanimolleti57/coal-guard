'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Play,
  RotateCw,
  Eye,
  FileSearch,
  CheckSquare,
  XSquare,
  Building2,
  User,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminDocumentDashboard() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    pendingCount: 0,
    analyzingCount: 0,
    completedCount: 0,
    goodCount: 0,
    badCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [docAnalysis, setDocAnalysis] = useState<any | null>(null);
  const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchAdminDocs();
  }, [filterStatus]);

  const fetchAdminDocs = async () => {
    setLoading(true);
    try {
      const url = filterStatus === 'ALL' ? '/api/admin/documents' : `/api/admin/documents?status=${filterStatus}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        setStats(data.stats || {});
        if (data.documents.length > 0 && !selectedDoc) {
          fetchDocAnalysis(data.documents[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocAnalysis = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/analysis`);
      if (res.ok) {
        const data = await res.json();
        setDocAnalysis(data);
        const matched = documents.find((d) => d.id === docId);
        if (matched) setSelectedDoc(matched);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin approves request & triggers AI Analysis pipeline
  const handleApproveAndStartAiAnalysis = async (docId: string) => {
    setAnalyzingDocId(docId);
    try {
      const res = await fetch(`/api/documents/${docId}/analyze`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchAdminDocs();
        await fetchDocAnalysis(docId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingDocId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading Admin Document Review Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" /> Admin Document Review & Approval Queue
          </h1>
          <p className="text-xs text-slate-400">
            Receive manager requests, review documents, and approve execution of the AI safety analysis pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminDocs}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" /> Refresh Queue
          </button>
        </div>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Documents</span>
          <div className="text-xl font-black text-white">{stats.total || 0}</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-amber-500/30 space-y-1">
          <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">Pending Review</span>
          <div className="text-xl font-black text-amber-400">{stats.pendingCount || 0}</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-blue-500/30 space-y-1">
          <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider">AI Analyzing</span>
          <div className="text-xl font-black text-blue-400">{stats.analyzingCount || 0}</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider">Completed</span>
          <div className="text-xl font-black text-slate-200">{stats.completedCount || 0}</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-emerald-500/30 space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">🟢 GOOD Results</span>
          <div className="text-xl font-black text-emerald-400">{stats.goodCount || 0}</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-red-500/30 space-y-1">
          <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider">🔴 BAD Risks</span>
          <div className="text-xl font-black text-red-400">{stats.badCount || 0}</div>
        </div>
      </div>

      {/* Main Grid: Document Queue List & Inspection Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue List Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-amber-400" /> Incoming Manager Requests
            </h3>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-2.5 py-1 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_ADMIN_REVIEW">Pending Review</option>
              <option value="RE_ANALYSIS_REQUESTED">Re-Analysis Requests</option>
              <option value="AI_ANALYZING">AI Analyzing</option>
              <option value="AI_ANALYSIS_COMPLETED">Completed</option>
            </select>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {documents.length === 0 ? (
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                No documents found in queue.
              </div>
            ) : (
              documents.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                const isAnalyzing = analyzingDocId === doc.id || doc.status === 'AI_ANALYZING';
                return (
                  <div
                    key={doc.id}
                    onClick={() => fetchDocAnalysis(doc.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                      isSelected
                        ? 'bg-slate-900 border-amber-500 shadow-xl ring-1 ring-amber-500/50'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-xs text-white truncate max-w-[200px]">
                          {doc.name || doc.title}
                        </h4>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{doc.uploadedBy?.name || 'Mine Manager'}</span>
                          <span>•</span>
                          <span>{new Date(doc.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                          doc.status === 'PENDING_ADMIN_REVIEW'
                            ? 'bg-amber-950 text-amber-400 border-amber-800'
                            : doc.status === 'RE_ANALYSIS_REQUESTED'
                            ? 'bg-orange-950 text-orange-400 border-orange-800 animate-pulse'
                            : doc.status === 'AI_ANALYZING'
                            ? 'bg-blue-950 text-blue-400 border-blue-800 animate-pulse'
                            : doc.riskLevel === 'GOOD'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : doc.riskLevel === 'BAD'
                            ? 'bg-red-950 text-red-400 border-red-800'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {doc.status === 'RE_ANALYSIS_REQUESTED' ? 'RE-ANALYSIS REQUESTED' : doc.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400 font-mono text-[10px]">{doc.docType || 'SAFETY_PLAN'}</span>

                      {/* Approve & Start AI Analysis Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveAndStartAiAnalysis(doc.id);
                        }}
                        disabled={isAnalyzing}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-bold text-[10px] rounded-lg transition-all flex items-center gap-1 shadow"
                      >
                        {isAnalyzing ? (
                          <>
                            <RotateCw className="w-3 h-3 animate-spin" /> AI Analyzing...
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" /> Approve & Run AI Analysis
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detailed Inspection Page / View */}
        <div className="lg:col-span-2 space-y-6">
          {docAnalysis ? (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6 shadow-xl">
              {/* Header Info */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-white">{docAnalysis.documentName}</h2>
                  <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-3">
                    <span>Uploaded by: <strong className="text-slate-200">{docAnalysis.uploadedBy?.name || 'Manager'}</strong></span>
                    <span>•</span>
                    <span>{new Date(docAnalysis.uploadedAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  {docAnalysis.riskLevel === 'GOOD' ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-black text-xs">
                      🟢 GOOD (PROCEED)
                    </span>
                  ) : docAnalysis.riskLevel === 'BAD' ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-red-950 text-red-400 border border-red-800 rounded-full font-black text-xs">
                      🔴 BAD (DO NOT PROCEED)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-950 text-amber-400 border border-amber-800 rounded-full font-black text-xs">
                      🟡 PENDING ADMIN APPROVAL
                    </span>
                  )}
                  {docAnalysis.riskScore !== null && (
                    <div className="text-xs font-mono font-bold text-slate-300">
                      Score: <span className="text-amber-400">{docAnalysis.riskScore}/100</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ADMIN APPROVAL & TRIGGER BOX */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-400 uppercase font-extrabold tracking-wider block">
                      Admin Approval & AI Analysis Control
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {docAnalysis.status === 'PENDING_ADMIN_REVIEW'
                        ? 'Manager submitted document. Click below to approve and run AI analysis.'
                        : docAnalysis.status === 'RE_ANALYSIS_REQUESTED'
                        ? 'Manager requested re-analysis. Review precautions and click to approve AI re-analysis.'
                        : 'AI safety analysis completed.'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleApproveAndStartAiAnalysis(docAnalysis.documentId)}
                    disabled={analyzingDocId === docAnalysis.documentId}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2"
                  >
                    {analyzingDocId === docAnalysis.documentId ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" /> AI Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Approve & Run AI Analysis
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* AI Summary */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> AI Analysis Summary
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">{docAnalysis.aiSummary}</p>
              </div>

              {/* Requirements Checked Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Coal Guard Safety Requirements Checked ({docAnalysis.findings?.totalChecked || 0})
                  </h4>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5" /> Passed: {docAnalysis.findings?.passedCount || 0}
                    </span>
                    <span className="text-red-400 flex items-center gap-1">
                      <XSquare className="w-3.5 h-3.5" /> Failed: {docAnalysis.findings?.failedCount || 0}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {docAnalysis.findings?.failed.map((f: any) => (
                    <div key={f.id} className="p-3 bg-red-950/20 border border-red-800/60 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-red-400">
                        <span>{f.requirement?.title || 'Safety Requirement'}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-red-950 text-red-300 rounded border border-red-800">
                          {f.severity} SEVERITY
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">{f.finding}</p>
                    </div>
                  ))}

                  {docAnalysis.findings?.passed.map((f: any) => (
                    <div key={f.id} className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-emerald-400">
                        <span>{f.requirement?.title || 'Safety Requirement'}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-800">
                          PASSED
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{f.finding}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mandatory Precautions List */}
              {docAnalysis.precautions && docAnalysis.precautions.length > 0 && (
                <div className="bg-amber-950/20 border border-amber-800/60 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> AI Generated Mandatory Precautions
                  </h4>
                  <div className="space-y-2">
                    {docAnalysis.precautions.map((p: any, idx: number) => (
                      <div key={p.id || idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                        <span className="font-mono text-amber-400 font-bold shrink-0">{idx + 1}.</span>
                        <span>{p.description}</span>
                        <span
                          className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${
                            p.status === 'Completed'
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : p.status === 'In Progress'
                              ? 'bg-amber-950 text-amber-400 border-amber-800'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {p.status || 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs flex flex-col items-center justify-center min-h-[350px] space-y-2">
              <FileSearch className="w-10 h-10 text-slate-700" />
              <p>Select a document from the admin queue to view extracted requirements, manager request status, and approve AI risk analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
