'use client';

import React, { useEffect, useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Building2,
  User,
  ArrowRight,
  ShieldCheck,
  File,
  X,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ManagerDocumentUploadProps {
  onNavigateToReview?: () => void;
}

export default function ManagerDocumentUpload({ onNavigateToReview }: ManagerDocumentUploadProps) {
  const { user, token } = useAuth();
  const [mines, setMines] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('SAFETY_PLAN');
  const [mineId, setMineId] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileExtractedText, setFileExtractedText] = useState('');
  const [fileDataUrl, setFileDataUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<any | null>(null);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);

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
        setMines(mData.mines || []);
        if (mData.mines && mData.mines.length > 0) {
          setMineId(mData.mines[0].id);
        }
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

  // Helper to read file and extract text + Base64
  const processSelectedFile = (selected: File) => {
    setFile(selected);
    if (!title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ''));
    }

    // Read Data URL for preview/fileUrl
    const readerUrl = new FileReader();
    readerUrl.onload = () => {
      setFileDataUrl(readerUrl.result as string);
    };
    readerUrl.readAsDataURL(selected);

    // Read Text Content
    const readerText = new FileReader();
    readerText.onload = () => {
      const text = readerText.result as string;
      if (text) {
        // Filter readable ASCII text strings
        const cleaned = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
        setFileExtractedText(cleaned);
      }
    };
    readerText.readAsText(selected);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
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
          fileUrl: fileDataUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          fileContent: fileExtractedText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUploadSuccess(data.document);
        setTitle('');
        setDescription('');
        setFile(null);
        setFileExtractedText('');
        setFileDataUrl('');
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
            <Upload className="w-6 h-6 text-amber-400" /> Statutory Mine Document Upload
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload statutory mining documents, environmental reports & safety plans for Admin AI Risk Analysis.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-950 p-2 rounded-2xl border border-slate-800">
          <span className="text-slate-400">Status Lifecycle:</span>
          <span className="font-mono text-amber-400 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
            🟡 SUBMITTED
          </span>
        </div>
      </div>

      {/* Upload Success Banner */}
      {uploadSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-600 p-5 rounded-2xl text-xs text-emerald-200 space-y-3 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-black text-sm text-white">Document uploaded successfully!</h4>
                <p className="text-emerald-300/90 text-xs">
                  Document status set to 🟡 <strong>SUBMITTED</strong>. It is now queued in Admin AI Analysis.
                </p>
              </div>
            </div>

            {onNavigateToReview && (
              <button
                onClick={onNavigateToReview}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow flex items-center gap-1"
              >
                Go to Review & Analysis <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Document Upload Form */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* File Drag and Drop Zone */}
          <div>
            <label className="font-extrabold text-white text-xs uppercase tracking-wider block mb-2">
              Select or Drag Document File (PDF / DOCX / TXT / PNG / CSV) *
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-700 hover:border-amber-500/70 bg-slate-950/80 p-8 rounded-2xl text-center space-y-3 transition-all cursor-pointer"
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <input
                id="file-upload-input"
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,.csv,.json,.png,.jpg,.jpeg"
                onChange={handleFileChange}
              />
              <Upload className="w-8 h-8 text-amber-400 mx-auto" />
              <div>
                <span className="font-bold text-white text-sm block">
                  {file ? file.name : 'Click to Browse or Drag & Drop Document'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Supported formats: PDF, DOCX, TXT, CSV, JSON, PNG, JPG (Max 50MB)
                </span>
              </div>
            </div>

            {/* Extracted File Text Live Preview Box */}
            {fileExtractedText && (
              <div className="mt-3 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase block flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Extracted Uploaded File Text Preview
                </span>
                <p className="text-[11px] font-mono text-slate-300 max-h-24 overflow-y-auto whitespace-pre-wrap">
                  {fileExtractedText.slice(0, 500)}...
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="font-bold text-slate-300 block mb-1.5">Document Title / Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sonepur Bazari Environmental Sensor Report Q3 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            {/* Document Type */}
            <div>
              <label className="font-bold text-slate-300 block mb-1.5">Document Type *</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              >
                <option value="SAFETY_PLAN">Safety Plan & Operating Procedure</option>
                <option value="SAFETY_AUDIT">Statutory Safety Audit Log</option>
                <option value="ENVIRONMENTAL_REPORT">Environmental Sensor & Telemetry Report</option>
                <option value="SLOPE_STABILITY_AUDIT">Opencast Slope Stability Geotechnical Audit</option>
                <option value="DGMS_APPROVAL">DGMS Statutory Statutory Approval Document</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Mine */}
            <div>
              <label className="font-bold text-slate-300 block mb-1.5">Target Mine / Site *</label>
              <select
                value={mineId}
                onChange={(e) => setMineId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              >
                {mines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Manager Name */}
            <div>
              <label className="font-bold text-slate-300 block mb-1.5">Uploading Manager</label>
              <input
                type="text"
                disabled
                value={user ? `${user.name} (${user.role})` : 'Mine Manager'}
                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-400 font-mono font-medium"
              />
            </div>
          </div>

          {/* Description & Sensor Values Box */}
          <div>
            <label className="font-bold text-slate-300 block mb-1.5">
              Document Description / Sensor Telemetry Notes (PM10, PM2.5, Water pH, Noise dB)
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Environmental Readings: PM10: 180 ug/m3, PM2.5: 95 ug/m3, Water pH: 5.4, Noise: 91 dB"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {submitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" /> Uploading Document...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Upload Document (Submit to Admin Queue)
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Manager Uploads List */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" /> Recent Manager Document Submissions
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Mine / Site</th>
                <th className="py-3 px-4">Upload Date</th>
                <th className="py-3 px-4">Submission Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {recentDocs.slice(0, 5).map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-white">{d.title || d.name}</td>
                  <td className="py-3 px-4 text-slate-300">{d.mine?.name || 'Coal Mine Site'}</td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">{new Date(d.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 font-bold rounded-full text-[10px] uppercase">
                      🟡 {d.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
