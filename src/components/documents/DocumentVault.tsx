'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  Calendar,
  FileUp,
  FileCheck,
  X,
  Loader2,
  Eye,
  ShieldCheck,
  Building2,
  Download,
  Camera,
  ScanLine,
  ScanText,
  Image as ImageIcon,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  CheckSquare,
  XSquare,
  Play,
  ArrowRight,
  Clock,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DocumentVault() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mines, setMines] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [docAnalysis, setDocAnalysis] = useState<any | null>(null);

  // Tab mode for Upload form: 'FILE' | 'CAMERA'
  const [inputMode, setInputMode] = useState<'FILE' | 'CAMERA'>('FILE');

  // File Upload & Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [docType, setDocType] = useState('SAFETY_PLAN');
  const [description, setDescription] = useState('');
  const [mineId, setMineId] = useState('');

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Processing & Action states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const [dRes, mRes] = await Promise.all([fetch('/api/documents'), fetch('/api/mines')]);
      if (dRes.ok) {
        const json = await dRes.json();
        const dList = json.documents || [];
        setDocuments(dList);
        if (dList.length > 0 && !selectedDoc) {
          fetchDocAnalysis(dList[0].id);
        }
      }
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

  const fetchDocAnalysis = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/analysis`);
      if (res.ok) {
        const data = await res.json();
        setDocAnalysis(data);
        const found = documents.find((d) => d.id === docId);
        if (found) setSelectedDoc(found);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Convert File to Base64 Data URL
  const processFileToDataUrl = (file: File) => {
    setSelectedFile(file);
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setName(fileNameWithoutExt);

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileDataUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFileToDataUrl(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          title: name,
          docType,
          fileType: docType,
          mineId,
          description,
          fileUrl: fileDataUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActionSuccessMsg(`Document "${name}" uploaded successfully! Status: PENDING_ADMIN_REVIEW`);
        setTimeout(() => setActionSuccessMsg(null), 5000);

        await fetchDocs();
        if (data.document) {
          fetchDocAnalysis(data.document.id);
        }

        // Reset form
        setName('');
        setDescription('');
        setSelectedFile(null);
        setFileDataUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to upload document');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manager Proceed action (for GOOD document)
  const handleProceedAction = async (docId: string) => {
    setIsSubmitting(true);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);

    try {
      const res = await fetch(`/api/documents/${docId}/proceed`, {
        method: 'POST',
      });

      if (res.ok) {
        setActionSuccessMsg('🟢 Document Proceed action approved successfully!');
        await fetchDocs();
        await fetchDocAnalysis(docId);
      } else {
        const errJson = await res.json();
        setActionErrorMsg(errJson.error || 'Cannot proceed with this document.');
      }
    } catch (e: any) {
      setActionErrorMsg(e.message || 'Proceed action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Precaution status
  const handleUpdatePrecautionStatus = async (precautionId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : currentStatus === 'Pending' ? 'In Progress' : 'Completed';
    try {
      const res = await fetch(`/api/precautions/${precautionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok && selectedDoc) {
        fetchDocAnalysis(selectedDoc.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Request Re-Analysis
  const handleRequestReanalyze = async (docId: string) => {
    setIsSubmitting(true);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);

    try {
      const res = await fetch(`/api/documents/${docId}/reanalyze`, {
        method: 'POST',
      });

      if (res.ok) {
        setActionSuccessMsg('📩 Re-analysis request submitted to Admin! Sent to Admin queue for review & approval.');
        await fetchDocs();
        await fetchDocAnalysis(docId);
      }
    } catch (e: any) {
      setActionErrorMsg(e.message || 'Re-analysis failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading Manager Document Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" /> Manager Document Vault & AI Safety Analysis
          </h1>
          <p className="text-xs text-slate-400">
            Upload safety plans, DGMS clearances & environmental permits for admin review, structured AI risk scoring, and precaution tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold">
          <Sparkles className="w-4 h-4 text-amber-400" /> AI Safety Pipeline Active
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 p-4 rounded-xl text-xs flex items-center gap-3 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{actionSuccessMsg}</span>
        </div>
      )}

      {actionErrorMsg && (
        <div className="bg-red-950/80 border border-red-800 text-red-300 p-4 rounded-xl text-xs flex items-center gap-3 animate-fade-in shadow-lg">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="font-semibold">{actionErrorMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form + Document List */}
        <div className="space-y-4">
          {/* Upload Card for Manager */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <FileUp className="w-4 h-4 text-amber-400" /> Upload Document for Admin Review
            </h3>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              {/* File Dropzone Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  fileDataUrl
                    ? 'border-amber-500 bg-amber-500/5'
                    : 'border-slate-800 bg-slate-950 hover:border-amber-500/50 hover:bg-slate-900/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {fileDataUrl ? (
                  <div className="flex items-center justify-between text-left bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-white text-xs block truncate">
                          {selectedFile ? selectedFile.name : 'Uploaded File'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : '420 KB'} • Click to replace
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      className="p-1 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 shrink-0 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 py-1">
                    <Upload className="w-6 h-6 text-amber-400 mx-auto" />
                    <div className="font-bold text-slate-200">Click to choose document or drop file</div>
                    <div className="text-[10px] text-slate-500">PDF, DOC/DOCX, PNG, JPG (Max 25MB)</div>
                  </div>
                )}
              </div>

              {/* Document Name */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Document Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mining Operation Safety Plan 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Type and Target Mine */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="SAFETY_PLAN">MINING SAFETY PLAN</option>
                    <option value="LICENSE">STATUTORY LICENSE</option>
                    <option value="CERTIFICATE">SAFETY CERTIFICATE</option>
                    <option value="INSPECTION_REPORT">INSPECTION REPORT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Target Mine</label>
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
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of mining safety procedures included..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting Document...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Upload Document → Submit to Admin
                  </>
                )}
              </button>
            </form>
          </div>

          {/* List of Documents */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
              Manager Document Records ({documents.length})
            </h4>

            {documents.map((d) => {
              const isSelected = selectedDoc?.id === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => fetchDocAnalysis(d.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white truncate max-w-[170px]">
                      {d.name || d.title}
                    </span>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${
                        d.riskLevel === 'GOOD'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : d.riskLevel === 'BAD'
                          ? 'bg-red-950 text-red-400 border-red-800'
                          : 'bg-amber-950 text-amber-400 border-amber-800'
                      }`}
                    >
                      {d.riskLevel ? `🟢 ${d.riskLevel}` : '🟡 PENDING'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-500" /> {d.mine?.name || 'Mine'}
                    </span>
                    <span className="font-mono text-amber-400 font-bold">{d.status.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Analysis Details & Decision Workings */}
        <div className="lg:col-span-2 space-y-6">
          {docAnalysis ? (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6 shadow-xl">
              {/* Document Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-white">{docAnalysis.documentName}</h2>
                  <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-3">
                    <span>Uploaded: {new Date(docAnalysis.uploadedAt).toLocaleDateString('en-IN')}</span>
                    <span>•</span>
                    <span>Status: <strong className="text-amber-400">{docAnalysis.status}</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  {docAnalysis.riskLevel === 'GOOD' ? (
                    <div className="px-4 py-2 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-emerald-400 text-xs font-black flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> 🟢 GOOD (PROCEED)
                    </div>
                  ) : docAnalysis.riskLevel === 'BAD' ? (
                    <div className="px-4 py-2 bg-red-950/80 border border-red-800 rounded-2xl text-red-400 text-xs font-black flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> 🔴 BAD (DO NOT PROCEED)
                    </div>
                  ) : (
                    <div className="px-4 py-2 bg-amber-950/80 border border-amber-800 rounded-2xl text-amber-400 text-xs font-black flex items-center gap-2">
                      <Clock className="w-4 h-4" /> 🟡 PENDING ADMIN REVIEW
                    </div>
                  )}
                </div>
              </div>

              {/* MANAGER DECISION & ACTION PANEL */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" /> Manager Workflow Action & AI Decision
                </h3>

                {docAnalysis.riskLevel === 'GOOD' ? (
                  <div className="bg-emerald-950/30 border border-emerald-800/60 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400 text-sm">🟢 RESULT: GOOD</span>
                      <span className="font-mono text-slate-300 font-bold">Score: {docAnalysis.riskScore}/100</span>
                    </div>
                    <p className="text-xs text-slate-200">
                      The document satisfies all required Coal Guard safety conditions. You can execute the Proceed action.
                    </p>
                    <button
                      onClick={() => handleProceedAction(docAnalysis.documentId)}
                      disabled={isSubmitting || docAnalysis.status === 'APPROVED'}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> ACTION: PROCEED WITH WORK
                    </button>
                  </div>
                ) : docAnalysis.riskLevel === 'BAD' ? (
                  <div className="bg-red-950/30 border border-red-800/60 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-red-400 text-sm">🔴 RESULT: BAD</span>
                      <span className="font-mono text-slate-300 font-bold">Score: {docAnalysis.riskScore}/100</span>
                    </div>
                    <p className="text-xs text-red-300 font-semibold">
                      ACTION: DO NOT PROCEED. Safety risks detected. Complete all mandatory precautions below before re-analysis.
                    </p>

                    {/* Precautions Checklist */}
                    <div className="space-y-2 pt-2 border-t border-red-900/40">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        Mandatory Precautions Checklist:
                      </h4>
                      {docAnalysis.precautions?.map((p: any, idx: number) => (
                        <div
                          key={p.id}
                          onClick={() => handleUpdatePrecautionStatus(p.id, p.status)}
                          className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer hover:border-amber-500/50 transition-all text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                                p.status === 'Completed'
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                  : p.status === 'In Progress'
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                                  : 'bg-slate-950 text-slate-600 border-slate-700'
                              }`}
                            >
                              {p.status === 'Completed' && <Check className="w-3.5 h-3.5 font-black" />}
                            </div>
                            <span className={p.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-200 font-medium'}>
                              {p.description}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                              p.status === 'Completed'
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                : p.status === 'In Progress'
                                ? 'bg-amber-950 text-amber-400 border-amber-800'
                                : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleRequestReanalyze(docAnalysis.documentId)}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow flex items-center gap-2"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} /> Request AI Re-Analysis
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-950/20 border border-amber-800/40 p-4 rounded-xl text-xs text-amber-300">
                    Document is pending Admin review and AI safety analysis. Once AI analyzes the document, decision status will appear here.
                  </div>
                )}
              </div>

              {/* AI Summary */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> AI Safety Analysis Summary
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">{docAnalysis.aiSummary}</p>
              </div>

              {/* Requirements Checked Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  Requirements Evaluated ({docAnalysis.findings?.totalChecked || 0})
                </h4>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
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
            </div>
          ) : (
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs flex flex-col items-center justify-center min-h-[350px] space-y-2">
              <Eye className="w-10 h-10 text-slate-700" />
              <p>Select a document from your manager records to view AI analysis decision, GOOD/BAD score, and precautions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
