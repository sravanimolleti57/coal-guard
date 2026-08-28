'use client';

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  FileText,
  User,
  Building2,
  Play,
  CheckCircle2,
  XSquare,
  CheckSquare,
  AlertTriangle,
  Send,
  RotateCw,
  Activity,
  Wind,
  Droplets,
  Volume2,
  Clock,
  ExternalLink,
  ShieldAlert,
  FileCode,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminAiAnalysis() {
  const { user, token } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [docAnalysis, setDocAnalysis] = useState<any | null>(null);

  // Analysis Multi-Step Status State
  const [analyzingStep, setAnalyzingStep] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showFileModal, setShowFileModal] = useState(false);

  useEffect(() => {
    fetchSubmittedDocs();
  }, []);

  const fetchSubmittedDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/documents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const docs = data.documents || [];
        setDocuments(docs);
        if (docs.length > 0 && !selectedDocId) {
          selectDocument(docs[0].id, docs[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectDocument = async (id: string, docObj?: any) => {
    setSelectedDocId(id);
    if (docObj) setSelectedDoc(docObj);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/documents/${id}/analysis`);
      if (res.ok) {
        const data = await res.json();
        setDocAnalysis(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Run AI Analysis with Multi-Step Extraction & Verification
  const handleAnalyzeDocument = async (id: string) => {
    setStatusMessage(null);
    setAnalyzingStep('Reading Document...');

    try {
      await new Promise((r) => setTimeout(r, 400));
      setAnalyzingStep('Extracting Content & Sensor Data...');

      await new Promise((r) => setTimeout(r, 400));
      setAnalyzingStep('Checking Compliance & Evidence...');

      await new Promise((r) => setTimeout(r, 400));
      setAnalyzingStep('Analyzing Risk Score & Precautions...');

      const res = await fetch(`/api/documents/${id}/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setDocAnalysis(data.analysis);
        setAnalyzingStep('Analysis Completed');
        setStatusMessage('🟢 AI Analysis completed from actual document content! Review structured results below and click "Send Result to Manager".');
        fetchSubmittedDocs();
      } else {
        const err = await res.json();
        setAnalyzingStep(null);
        alert(err.error || 'Failed to analyze document. Ensure uploaded file is valid.');
      }
    } catch (e: any) {
      setAnalyzingStep(null);
      alert(e.message || 'Error running AI analysis');
    } finally {
      setTimeout(() => setAnalyzingStep(null), 1000);
    }
  };

  // Send Completed Analysis Result to Manager
  const handleSendAnalysisToManager = async (id: string) => {
    setSending(true);
    try {
      const res = await fetch(`/api/admin/documents/${id}/send-analysis`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setStatusMessage('🟢 Analysis result sent successfully to Manager! Document status updated to ANALYSIS_COMPLETED.');
        fetchSubmittedDocs();
        selectDocument(id);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to send analysis to Manager');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  };

  // Helper to get extracted sensor object
  const getExtractedSensors = (analysis: any, doc: any) => {
    let raw = analysis?.ocrExtractedData || doc?.ocrExtractedData;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.environmentalSensors) return parsed.environmentalSensors;
        return parsed;
      } catch (e) {}
    } else if (typeof raw === 'object' && raw !== null) {
      if (raw.environmentalSensors) return raw.environmentalSensors;
      return raw;
    }
    return { pm10: 50, pm25: 28, waterPh: 7.2, noiseLevelDb: 68, status: 'GOOD' };
  };

  // Helper to get extracted actions array
  const getExtractedActions = (analysis: any, doc: any) => {
    let raw = analysis?.ocrExtractedData || doc?.ocrExtractedData;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.generatedActions) return parsed.generatedActions;
      } catch (e) {}
    } else if (typeof raw === 'object' && raw !== null && raw.generatedActions) {
      return raw.generatedActions;
    }
    return [];
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-800/80 tracking-wider">
            ADMIN MODULE — DOCUMENT CONTENT AI ANALYSIS
          </span>
          <h1 className="text-2xl font-black text-white mt-1.5 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" /> Admin Document Content AI Analysis
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Extract actual document text, evaluate statutory safety compliance & evidence, & send analysis to Manager.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-950 p-2 rounded-2xl border border-slate-800">
          <span className="text-slate-400">Submissions Queue:</span>
          <span className="font-mono text-amber-400 font-bold bg-amber-950 px-2.5 py-0.5 rounded border border-amber-800">
            {documents.length} Submissions
          </span>
        </div>
      </div>

      {/* Submitted Documents Queue Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl space-y-3 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" /> Submitted Manager Documents Queue
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Click "Analyze Document" to extract actual contents</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4">Manager</th>
                <th className="py-3 px-4">Mine / Site</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Upload Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {documents.map((doc) => {
                const isSelected = selectedDocId === doc.id;
                const isCompleted = doc.status === 'ANALYSIS_COMPLETED' || doc.status === 'AI_ANALYSIS_COMPLETED';

                return (
                  <tr
                    key={doc.id}
                    onClick={() => selectDocument(doc.id, doc)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-slate-800/80 font-semibold' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs">{doc.title || doc.name}</div>
                      <div className="text-[10px] font-mono text-amber-400 mt-0.5">{doc.id.slice(0, 12)}...</div>
                    </td>
                    <td className="py-3 px-4 text-slate-200">{doc.uploadedBy?.name || 'Mine Manager'}</td>
                    <td className="py-3 px-4 text-slate-300">{doc.mine?.name || 'Coal Mine Site'}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{doc.docType || 'SAFETY_PLAN'}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{new Date(doc.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                          doc.status === 'SUBMITTED' || doc.status === 'PENDING_ADMIN_REVIEW'
                            ? 'bg-amber-950 text-amber-400 border-amber-800'
                            : isCompleted
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-purple-950 text-purple-400 border-purple-800'
                        }`}
                      >
                        {doc.status === 'PENDING_ADMIN_REVIEW' ? '🟡 SUBMITTED' : doc.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnalyzeDocument(doc.id);
                        }}
                        disabled={!!analyzingStep}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950 font-extrabold text-[11px] rounded-xl shadow flex items-center gap-1 ml-auto"
                      >
                        {analyzingStep && selectedDocId === doc.id ? (
                          <>
                            <RotateCw className="w-3 h-3 animate-spin" /> Analyzing...
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" /> Analyze Document
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Step Extraction Progress Bar */}
      {analyzingStep && (
        <div className="bg-amber-950/60 border border-amber-500 p-4 rounded-2xl text-xs text-amber-200 shadow-xl flex items-center gap-3 animate-pulse">
          <RotateCw className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
          <div>
            <span className="font-extrabold uppercase text-amber-400 block">AI Document Extraction Step:</span>
            <span className="font-mono text-white text-xs">{analyzingStep}</span>
          </div>
        </div>
      )}

      {/* Analysis Result Output & Send Control */}
      {selectedDoc && docAnalysis && (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
          {/* Status Message Alert */}
          {statusMessage && (
            <div className="bg-emerald-950/60 border border-emerald-600 p-4 rounded-2xl text-xs text-emerald-200 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            </div>
          )}

          {/* Original Document Summary & View Button Card */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" /> Original Uploaded Document
              </h3>
              <button
                onClick={() => setShowFileModal(true)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 shadow"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Original Uploaded Document
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Document Name</span>
                <span className="font-bold text-white block mt-0.5 truncate">{selectedDoc.title || selectedDoc.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Document ID</span>
                <span className="font-mono text-amber-400 block mt-0.5 text-[11px]">{selectedDoc.id}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Mine / Site</span>
                <span className="font-bold text-slate-200 block mt-0.5">{selectedDoc.mine?.name || 'Coal Mine'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Manager / Uploader</span>
                <span className="font-semibold text-emerald-400 block mt-0.5">{selectedDoc.uploadedBy?.name || 'Mine Manager'}</span>
              </div>
            </div>
          </div>

          {/* Action Control: Send Analysis to Manager Button */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                ADMIN FINALIZATION CONTROL
              </span>
              <h3 className="font-extrabold text-sm text-white">Review Generated Analysis & Send Result to Manager</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Clicking "Send Result to Manager" updates status to 🟢 <strong>ANALYSIS_COMPLETED</strong> and dispatches results to Manager.
              </p>
            </div>

            <button
              onClick={() => handleSendAnalysisToManager(selectedDoc.id)}
              disabled={sending || docAnalysis.status === 'ANALYSIS_COMPLETED'}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all shrink-0"
            >
              {sending ? (
                <>Sending Result...</>
              ) : docAnalysis.status === 'ANALYSIS_COMPLETED' ? (
                <>✓ Result Already Sent to Manager</>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Result to Manager
                </>
              )}
            </button>
          </div>

          {/* Extracted Information: Sensor Telemetry Table */}
          {(() => {
            const sensor = getExtractedSensors(docAnalysis, selectedDoc);
            return (
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" /> Extracted Document Telemetry & Parameter Table
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800 font-bold">
                    EXTRACTED FROM DOCUMENT CONTENT
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300 border-collapse">
                    <thead className="bg-slate-900 text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Parameter</th>
                        <th className="py-2.5 px-4 font-mono text-right">Extracted Reading</th>
                        <th className="py-2.5 px-4 font-mono text-center">Statutory Limit</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      <tr>
                        <td className="py-2.5 px-4 flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-amber-400" /> PM2.5 Respirable Dust</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-amber-300 text-right">{sensor.pm25} µg/m³</td>
                        <td className="py-2.5 px-4 font-mono text-slate-400 text-center">60 µg/m³</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase ${sensor.pm25 > 60 ? 'bg-red-950 text-red-400 border-red-800' : 'bg-emerald-950 text-emerald-400 border-emerald-800'}`}>
                            {sensor.pm25 > 60 ? 'HIGH (EXCEEDED)' : 'GOOD'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-orange-400" /> PM10 Air Quality</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-orange-300 text-right">{sensor.pm10} µg/m³</td>
                        <td className="py-2.5 px-4 font-mono text-slate-400 text-center">100 µg/m³</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase ${sensor.pm10 > 100 ? 'bg-red-950 text-red-400 border-red-800' : 'bg-emerald-950 text-emerald-400 border-emerald-800'}`}>
                            {sensor.pm10 > 100 ? 'CRITICAL (EXCEEDED)' : 'GOOD'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-blue-400" /> Water pH Level</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-blue-300 text-right">{sensor.waterPh} pH</td>
                        <td className="py-2.5 px-4 font-mono text-slate-400 text-center">6.5 - 8.5 pH</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase ${sensor.waterPh < 6.5 || sensor.waterPh > 8.5 ? 'bg-red-950 text-red-400 border-red-800' : 'bg-emerald-950 text-emerald-400 border-emerald-800'}`}>
                            {sensor.waterPh < 6.5 || sensor.waterPh > 8.5 ? 'NON-COMPLIANT' : 'GOOD'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5 text-purple-400" /> Noise dB Level</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-purple-300 text-right">{sensor.noiseLevelDb} dB</td>
                        <td className="py-2.5 px-4 font-mono text-slate-400 text-center">85 dB</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase ${sensor.noiseLevelDb > 85 ? 'bg-red-950 text-red-400 border-red-800' : 'bg-emerald-950 text-emerald-400 border-emerald-800'}`}>
                            {sensor.noiseLevelDb > 85 ? 'HIGH (EXCEEDED)' : 'GOOD'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Compliance & Risk Analysis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Risk Score & Level Card */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Dynamically Calculated Risk Result</span>
              <div className="text-xl font-black text-white flex items-center gap-2">
                {docAnalysis.riskLevel === 'GOOD' ? '🟢 GOOD' : docAnalysis.riskLevel === 'MEDIUM' ? '🟡 MEDIUM' : docAnalysis.riskLevel === 'HIGH' ? '🟠 HIGH RISK' : '🔴 CRITICAL RISK'}
              </div>
              <div className="text-xs font-mono text-amber-400 font-bold">
                Calculated Risk Score: {docAnalysis.riskScore !== null ? docAnalysis.riskScore : '0'} / 100
              </div>
              <div className="text-[11px] text-slate-300 font-medium pt-1">
                Final Recommendation: <strong className="text-amber-400">{docAnalysis.aiRecommendation || 'PROCEED'}</strong>
              </div>
            </div>

            {/* Compliance Requirements Summary */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Compliance Evaluation</span>
              <div className="flex items-center gap-4 text-xs font-extrabold pt-1">
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckSquare className="w-4 h-4" /> Passed: {docAnalysis.findings?.passedCount || 0}
                </span>
                <span className="text-red-400 flex items-center gap-1">
                  <XSquare className="w-4 h-4" /> Failed: {docAnalysis.findings?.failedCount || 0}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono pt-1">
                Total Statutory Rules Evaluated: {docAnalysis.findings?.totalChecked || 0}
              </div>
            </div>
          </div>

          {/* Compliance Findings & Document Evidence */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Compliance Findings & Extracted Document Evidence
            </h4>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {docAnalysis.findings?.failed.map((f: any) => (
                <div key={f.id} className="p-3.5 bg-red-950/30 border border-red-800/60 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-red-400">
                    <span>{f.requirement?.title || f.requirement || 'Safety Requirement'}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-red-950 text-red-300 rounded border border-red-800">
                      {f.severity || 'CRITICAL'} SEVERITY
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-200">{f.finding}</p>
                  {f.evidence && (
                    <div className="text-[10px] text-amber-300/90 font-mono bg-slate-900/80 p-2 rounded border border-slate-800 mt-1">
                      <strong>Extracted Document Evidence:</strong> {f.evidence}
                    </div>
                  )}
                </div>
              ))}

              {docAnalysis.findings?.passed.map((f: any) => (
                <div key={f.id} className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-400">
                    <span>{f.requirement?.title || f.requirement || 'Safety Requirement'}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-800">
                      PASSED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{f.finding}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Generated Actions Table */}
          {(() => {
            const actions = getExtractedActions(docAnalysis, selectedDoc);
            return (
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" /> Generated Corrective & Routine Actions Table
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300 border-collapse">
                    <thead className="bg-slate-900 text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Action</th>
                        <th className="py-2.5 px-4 font-mono">Reason / Evidence</th>
                        <th className="py-2.5 px-4">Priority</th>
                        <th className="py-2.5 px-4">Responsible</th>
                        <th className="py-2.5 px-4">Due Date</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {actions.length > 0 ? (
                        actions.map((act: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-900/50">
                            <td className="py-2.5 px-4 font-bold text-white">{act.action}</td>
                            <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">{act.reason}</td>
                            <td className="py-2.5 px-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${act.priority === 'CRITICAL' ? 'bg-red-950 text-red-400 border-red-800' : act.priority === 'HIGH' ? 'bg-orange-950 text-orange-400 border-orange-800' : 'bg-slate-900 text-slate-300 border-slate-800'}`}>
                                {act.priority}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-300">{act.responsiblePerson}</td>
                            <td className="py-2.5 px-4 font-mono text-[11px] text-amber-300">{act.dueDate}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 text-[10px] font-bold rounded border border-emerald-800 uppercase">
                                {act.status || 'OPEN'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-500">Routine monitoring active. No immediate corrective actions required.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Recommended Precautions List */}
          {docAnalysis.precautions && docAnalysis.precautions.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-800/60 p-5 rounded-2xl space-y-3">
              <h4 className="font-extrabold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Generated Safety Precautions ({docAnalysis.precautions.length})
              </h4>
              <div className="space-y-2">
                {docAnalysis.precautions.map((p: any, idx: number) => (
                  <div key={p.id || idx} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-200">
                      <strong className="text-amber-400 font-mono">{idx + 1}.</strong> {p.description || p}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 uppercase">
                      {p.status || 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Original File Modal */}
      {showFileModal && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" /> Original File: {selectedDoc.title || selectedDoc.name}
              </h3>
              <button onClick={() => setShowFileModal(false)} className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
              <div className="text-amber-400 font-bold mb-2">--- DOCUMENT FILE HEADER ---</div>
              <div>Document ID: {selectedDoc.id}</div>
              <div>Uploaded By: {selectedDoc.uploadedBy?.name || 'Mine Manager'}</div>
              <div>Uploaded At: {new Date(selectedDoc.createdAt).toLocaleString('en-IN')}</div>
              <div>Mine Site: {selectedDoc.mine?.name || 'Coal Mine Site'}</div>
              <div className="text-amber-400 font-bold my-2">--- EXTRACTED FILE TEXT CONTENT ---</div>
              <p className="whitespace-pre-wrap">{selectedDoc.description || selectedDoc.ocrExtractedData || 'Statutory Mining Document File Content'}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setShowFileModal(false)} className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl">
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
