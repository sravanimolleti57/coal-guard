'use client';

import React, { useEffect, useState } from 'react';
import { Upload, FileText, CheckCircle2, Clock, AlertTriangle, Building2, ShieldCheck, ArrowRight, FileCheck, Layers } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ManagerDocumentUpload({ onNavigateToReview }: { onNavigateToReview?: () => void }) {
  const { user, token } = useAuth();
  const [mines, setMines] = useState<any[]>([]);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('SAFETY_PLAN');
  const [mineId, setMineId] = useState('');
  const [description, setDescription] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState<any | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [mRes, dRes] = await Promise.all([
        fetch('/api/mines'),
        fetch('/api/documents'),
      ]);
      if (mRes.ok) {
        const mData = await mRes.json();
        const mList = mData.mines || [];
        setMines(mList);
        if (mList.length > 0) setMineId(mList[0].id);
      }
      if (dRes.ok) {
        const dData = await dRes.json();
        setRecentDocs(dData.documents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !mineId) {
      alert('Please enter document title and select target mine/site.');
      return;
    }

    setSubmitting(true);
    setUploadSuccess(null);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          name: title,
          docType,
          fileType: docType,
          mineId,
          description,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUploadSuccess(data.document);
        setTitle('');
        setDescription('');
        setFile(null);
        fetchInitialData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to upload document');
      }
    } catch (e: any) {
      alert(e.message || 'Error uploading document');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-800/80 tracking-wider">
            PAGE 1 — MANAGER DOCUMENT UPLOAD
          </span>
          <h1 className="text-2xl font-black text-white mt-1.5 flex items-center gap-2">
            <Upload className="w-6 h-6 text-amber-400" /> Upload Statutory Mining Document
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Submit statutory safety plans, slope stability reports, & environmental sensor logs to Officer for verification.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800 text-xs">
          <span className="font-bold text-slate-300">Logged in as:</span>
          <span className="font-mono text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/50">
            {user?.name || 'Mine Manager'} (MANAGER)
          </span>
        </div>
      </div>

      {/* Upload Success Alert Banner */}
      {uploadSuccess && (
        <div className="bg-amber-950/40 border border-amber-500 p-5 rounded-3xl text-amber-200 shadow-2xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h3 className="font-black text-sm text-white">Document Uploaded Successfully</h3>
                <p className="text-xs text-amber-300/90 mt-0.5">
                  <strong>{uploadSuccess.title || uploadSuccess.name}</strong> • Document ID: <code className="font-mono">{uploadSuccess.id}</code>
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-full shadow border border-amber-400">
              🟡 PENDING VERIFICATION
            </span>
          </div>

          {/* Workflow Status Progress Flow */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-[11px] space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Document Lifecycle Status Flow:</span>
            <div className="flex flex-wrap items-center gap-2 font-mono text-slate-300">
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-bold">UPLOADED</span>
              <span>→</span>
              <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded font-bold animate-pulse">PENDING VERIFICATION</span>
              <span>→</span>
              <span className="px-2 py-0.5 bg-slate-900 text-slate-500 rounded">SENT TO OFFICER</span>
              <span>→</span>
              <span className="px-2 py-0.5 bg-slate-900 text-slate-500 rounded">UNDER ANALYSIS</span>
              <span>→</span>
              <span className="px-2 py-0.5 bg-slate-900 text-slate-500 rounded">ANALYSIS COMPLETED</span>
            </div>
          </div>

          <div className="pt-1 flex justify-end">
            <button
              onClick={() => onNavigateToReview ? onNavigateToReview() : (window.location.href = '/manager/review-analysis')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
            >
              Track Status in Review & Analysis <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Upload Form Card */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-700 hover:border-amber-500/80 bg-slate-950/70 rounded-3xl p-8 text-center transition-all cursor-pointer group"
          >
            <input
              type="file"
              id="file-upload"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-inner">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">
                  {file ? file.name : 'Click to select document or Drag & Drop file here'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PDF, DOCX, PNG, JPG, TXT (Max 25MB). Auto-extracts PM10, PM2.5, Water pH, Noise dB telemetry.
                </p>
              </div>
              {file && (
                <span className="inline-block px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-mono rounded-full font-bold">
                  ✓ File Attached ({ (file.size / 1024 / 1024).toFixed(2) } MB)
                </span>
              )}
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Document Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sonepur Bazari Opencast Pit Safety & Environmental Report 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Document Type */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Document Type *
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="SAFETY_PLAN">Mining Safety & Evacuation Plan (CMR Reg 106)</option>
                <option value="ENVIRONMENTAL_REPORT">Environmental Sensor & Air/Water Report</option>
                <option value="SLOPE_STABILITY_AUDIT">Opencast Highwall & Slope Stability Survey</option>
                <option value="HEMM_INSPECTION">HEMM Shovel & Dumper Fleet Inspection Log</option>
                <option value="LABOUR_COMPLIANCE">Statutory Form D Worker Compliance Register</option>
              </select>
            </div>

            {/* Target Mine */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Target Mine / Site *
              </label>
              <select
                value={mineId}
                onChange={(e) => setMineId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-amber-500"
              >
                {mines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code}) — {m.state}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Optional Description & Telemetry Summary
              </label>
              <input
                type="text"
                placeholder="Brief summary or sensor values (e.g. PM10 95, PM2.5 48, pH 7.2, Noise 68)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>Uploading & Submitting...</>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Upload Document → Submit to Officer
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Uploads Quick Status Tracker */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Manager Upload Status Tracker ({recentDocs.length})
          </h3>
          <button
            onClick={() => onNavigateToReview ? onNavigateToReview() : (window.location.href = '/manager/review-analysis')}
            className="text-xs text-amber-400 hover:underline font-bold flex items-center gap-1"
          >
            View Full Review & Analysis Page <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {recentDocs.slice(0, 4).map((doc) => (
            <div key={doc.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="font-extrabold text-white">{doc.title || doc.name}</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>{doc.mine?.name || 'Coal Mine Site'}</span>
                  <span>•</span>
                  <span>{new Date(doc.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase ${
                    doc.status === 'PENDING_VERIFICATION' || doc.status === 'PENDING_ADMIN_REVIEW'
                      ? 'bg-amber-950 text-amber-400 border-amber-800'
                      : doc.status === 'SENT_TO_OFFICER'
                      ? 'bg-blue-950 text-blue-400 border-blue-800'
                      : doc.status === 'UNDER_ANALYSIS' || doc.status === 'AI_ANALYZING'
                      ? 'bg-purple-950 text-purple-400 border-purple-800 animate-pulse'
                      : doc.status === 'ANALYSIS_COMPLETED' || doc.status === 'AI_ANALYSIS_COMPLETED'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-red-950 text-red-400 border-red-800'
                  }`}
                >
                  {doc.status === 'PENDING_ADMIN_REVIEW' ? '🟡 PENDING VERIFICATION' : doc.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
