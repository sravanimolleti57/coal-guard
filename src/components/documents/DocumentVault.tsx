'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Upload, Sparkles, AlertCircle, CheckCircle2, Calendar, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DocumentVault() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mines, setMines] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  // Upload Form state
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('LICENSE');
  const [mineId, setMineId] = useState('');

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
        if (dList.length > 0 && !selectedDoc) setSelectedDoc(dList[0]);
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

  const handleUploadOcr = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'DGMS Quarterly Highwall Slope Audit Certificate 2026',
          docType,
          mineId,
          simulateOcr: true,
        }),
      });

      if (res.ok) {
        setTitle('');
        fetchDocs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading document vault & OCR service...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" /> Statutory Document Vault & OCR Parser
          </h1>
          <p className="text-xs text-slate-400">
            Upload mining clearances, DGMS permits & environmental licenses with automatic field extraction and compliance mapping.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold">
          <Sparkles className="w-4 h-4 text-amber-400" /> AI OCR Parser Active
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form + Document List */}
        <div className="space-y-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-400" /> Upload Document & Scan Fields
            </h3>

            <form onSubmit={handleUploadOcr} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DGMS Environmental Permit 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="LICENSE">LICENSE</option>
                    <option value="CERTIFICATE">CERTIFICATE</option>
                    <option value="INSPECTION_REPORT">INSPECTION REPORT</option>
                    <option value="REGULATORY_NOTICE">REGULATORY NOTICE</option>
                  </select>
                </div>

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
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Upload & Parse Document OCR
              </button>
            </form>
          </div>

          {/* List */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
              Vault Records ({documents.length})
            </h4>

            {documents.map((d) => {
              const isSelected = selectedDoc?.id === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDoc(d)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected ? 'bg-slate-900 border-amber-500 shadow-md' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white truncate max-w-[180px]">{d.title}</span>
                    <span className="text-[10px] bg-slate-950 text-amber-400 px-2 py-0.5 rounded font-mono border border-slate-800">
                      {d.docType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span>{d.mine.name}</span>
                    <span className="text-emerald-400 font-bold">{d.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* OCR Field Extraction Detail Viewer */}
        <div className="lg:col-span-2">
          {selectedDoc ? (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6 shadow-xl">
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-white">{selectedDoc.title}</h2>
                  <div className="text-xs text-amber-400 font-mono mt-1">{selectedDoc.docNumber}</div>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-emerald-950 text-emerald-400 rounded-full border border-emerald-800">
                  {selectedDoc.status}
                </span>
              </div>

              {/* OCR Parsed JSON Metadata */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> AI OCR Extracted Statutory Metadata
                  </h4>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-mono">
                    OCR Confidence: 98.5%
                  </span>
                </div>

                {selectedDoc.ocrExtractedData ? (
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {Object.entries(JSON.parse(selectedDoc.ocrExtractedData)).map(([k, v]: [string, any]) => (
                      <div key={k} className="bg-slate-900 p-3 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">{k.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-semibold text-slate-200 mt-0.5 block">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No OCR data parsed.</p>
                )}
              </div>

              {/* Document Link */}
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-400">Attached File: {selectedDoc.fileUrl}</span>
                <a
                  href={selectedDoc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-all"
                >
                  Download Statutory Copy
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
              Select a document to inspect AI OCR extracted fields.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
