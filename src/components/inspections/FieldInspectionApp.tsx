'use client';

import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Smartphone,
  Navigation,
  CheckSquare,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function FieldInspectionApp() {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<any[]>([]);
  const [mines, setMines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'mobile_field'>('mobile_field');

  // Mobile Field Inspection Form Stepper State
  const [step, setStep] = useState(1);
  const [selectedMineId, setSelectedMineId] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [inspectionType, setInspectionType] = useState('Safety');
  const [geoLat, setGeoLat] = useState<number>(23.6934);
  const [geoLng, setGeoLng] = useState<number>(87.2185);
  const [observationText, setObservationText] = useState('');
  const [severity, setSeverity] = useState('HIGH');
  const [photoUploaded, setPhotoUploaded] = useState(true);
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, text: 'Haul road dust suppression water sprinklers active', status: 'FAILED' },
    { id: 2, text: 'Highwall slope stability sensors calibrated & operational', status: 'PASSED' },
    { id: 3, text: 'Heavy excavator grounding & emergency stop switches verified', status: 'PASSED' },
    { id: 4, text: 'Worker mandatory PPE (helmets, high-vis vests, steel boots)', status: 'PASSED' },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inspRes, minesRes] = await Promise.all([fetch('/api/inspections'), fetch('/api/mines')]);
      if (inspRes.ok) setInspections((await inspRes.json()).inspections || []);
      if (minesRes.ok) {
        const mList = (await minesRes.json()).mines || [];
        setMines(mList);
        if (mList.length > 0) {
          setSelectedMineId(mList[0].id);
          if (mList[0].zones?.length > 0) setSelectedZoneId(mList[0].zones[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoLat(pos.coords.latitude);
          setGeoLng(pos.coords.longitude);
        },
        () => {
          setGeoLat(23.692 + Math.random() * 0.01);
          setGeoLng(87.217 + Math.random() * 0.01);
        }
      );
    }
  };

  const handleSubmitFieldInspection = async () => {
    try {
      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mineId: selectedMineId,
          zoneId: selectedZoneId,
          type: inspectionType,
          latitude: geoLat,
          longitude: geoLng,
          overallResult: severity === 'CRITICAL' ? 'CRITICAL_HALT' : 'ACTION_REQUIRED',
          summary: `Statutory field observation: ${observationText}`,
          checklists: checklistItems.map((c) => ({
            category: 'Field Inspection Check',
            itemText: c.text,
            status: c.status,
          })),
          observation: {
            description: observationText || 'Observed hazardous dust plume on Haul Road Bench 4 junction.',
            severity,
            photoUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop&q=60',
            createViolation: true,
          },
        }),
      });

      if (res.ok) {
        setStep(4); // Success step
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectedMineObj = mines.find((m) => m.id === selectedMineId);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-400" /> Statutory Field Inspections
          </h1>
          <p className="text-xs text-slate-400">
            Mobile-optimized field audit app with instant GPS geo-tagging, photo evidence & violation creation.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('mobile_field')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'mobile_field' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" /> Field Inspector Mobile UI
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'list' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Inspection History Log
          </button>
        </div>
      </div>

      {activeTab === 'mobile_field' ? (
        /* Mobile Field Inspection App UI Container */
        <div className="max-w-md mx-auto bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-amber-500/5">
          {/* Mobile App Bar */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 text-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 font-bold" />
              <span className="font-extrabold text-sm tracking-wide">DGMS Field Inspector App</span>
            </div>
            <span className="text-[10px] bg-slate-950 text-amber-400 font-mono px-2 py-0.5 rounded-full font-bold">
              STEP {step} / 3
            </span>
          </div>

          <div className="p-5 space-y-4">
            {/* Step 1: Select Mine & Zone */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" /> Select Mine & Pit Zone
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Mine Location</label>
                    <select
                      value={selectedMineId}
                      onChange={(e) => {
                        setSelectedMineId(e.target.value);
                        const m = mines.find((x) => x.id === e.target.value);
                        if (m?.zones?.length > 0) setSelectedZoneId(m.zones[0].id);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {mines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Zone / Extraction Pit</label>
                    <select
                      value={selectedZoneId}
                      onChange={(e) => setSelectedZoneId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {selectedMineObj?.zones?.map((z: any) => (
                        <option key={z.id} value={z.id}>
                          {z.name} ({z.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Inspection Category</label>
                    <select
                      value={inspectionType}
                      onChange={(e) => setInspectionType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Safety">Safety & Slope Audit</option>
                      <option value="Environmental">Environmental Dust & Water</option>
                      <option value="Equipment">HEMM Heavy Equipment</option>
                      <option value="Labour">Labour & Biometric Audit</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4"
                >
                  Proceed to Statutory Checklist <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2: Inspection Checklist */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-amber-400" /> Audit Checklist Items
                </h3>

                <div className="space-y-2 text-xs">
                  {checklistItems.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300 font-medium pr-2">{item.text}</span>
                      <button
                        onClick={() =>
                          setChecklistItems(
                            checklistItems.map((c) =>
                              c.id === item.id ? { ...c, status: c.status === 'PASSED' ? 'FAILED' : 'PASSED' } : c
                            )
                          )
                        }
                        className={`text-[10px] font-bold px-2.5 py-1 rounded ${
                          item.status === 'PASSED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {item.status}
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep(3)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4"
                >
                  Capture Observation & Geo-Tag <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 3: Observation, Photo & Geo-Tag */}
            {step === 3 && (
              <div className="space-y-4 text-xs">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-400" /> Evidence & Geo-Tagging
                </h3>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Field Observation Details</label>
                  <textarea
                    rows={3}
                    value={observationText}
                    onChange={(e) => setObservationText(e.target.value)}
                    placeholder="Describe non-conformance observation..."
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Severity Picker */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Severity Classification</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`py-2 text-[10px] font-bold rounded-lg transition-all ${
                          severity === sev
                            ? sev === 'CRITICAL'
                              ? 'bg-red-500 text-white'
                              : 'bg-amber-500 text-slate-950'
                            : 'bg-slate-950 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                {/* GPS Location Capture Display */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-bold flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-amber-400" /> Geo-Coordinates
                    </span>
                    <button onClick={handleCaptureLocation} className="text-[10px] text-amber-400 hover:underline font-bold">
                      Refresh GPS
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400">
                    Lat: {geoLat.toFixed(6)}° N | Lng: {geoLng.toFixed(6)}° E
                  </div>
                  <div className="text-[10px] text-slate-500">Timestamp: {new Date().toLocaleString('en-IN')}</div>
                </div>

                {/* Photo Upload Simulation */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Photo Evidence Captured (Watermarked)
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop&q=60"
                    alt="Evidence"
                    className="mt-2 h-24 w-full object-cover rounded-lg border border-slate-800"
                  />
                </div>

                <button
                  onClick={handleSubmitFieldInspection}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4"
                >
                  Submit Inspection & Auto-Generate Violation
                </button>
              </div>
            )}

            {/* Step 4: Submission Confirmation */}
            {step === 4 && (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-base text-white">Inspection Submitted!</h3>
                <p className="text-xs text-slate-400">
                  Observation logged with geo-tag (Lat: {geoLat.toFixed(4)}, Lng: {geoLng.toFixed(4)}). Violation task created and assigned to Mine Safety Manager.
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-slate-800 text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-700 mt-2"
                >
                  Start New Field Audit
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History Log List Table */
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Inspection Type</th>
                  <th className="py-3.5 px-4">Mine & Zone</th>
                  <th className="py-3.5 px-4">Inspector</th>
                  <th className="py-3.5 px-4">GPS Geo-Tag</th>
                  <th className="py-3.5 px-4">Result</th>
                  <th className="py-3.5 px-4">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {inspections.map((insp: any) => (
                  <tr key={insp.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{insp.type}</div>
                      <div className="text-[10px] text-slate-500">{new Date(insp.scheduledDate).toLocaleDateString('en-IN')}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{insp.mine.name}</div>
                      <div className="text-[10px] text-amber-400">{insp.zone?.name || 'General Pit'}</div>
                    </td>
                    <td className="py-3.5 px-4">{insp.inspector?.name || 'DGMS Inspector'}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-emerald-400">
                      {insp.latitude ? `${insp.latitude.toFixed(3)}°, ${insp.longitude?.toFixed(3)}°` : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-amber-950 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-800">
                        {insp.overallResult || 'PASSED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{insp.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
