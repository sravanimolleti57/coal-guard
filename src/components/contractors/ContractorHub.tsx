'use client';

import React, { useEffect, useState } from 'react';
import { HardHat, Users, ShieldAlert, Award, FileText, CheckCircle2, UserCheck, Calendar, Activity, Search, X, ChevronRight, Fingerprint, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ContractorHub() {
  const { user } = useAuth();
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractor, setSelectedContractor] = useState<any | null>(null);
  const [workerSearchQuery, setWorkerSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const cRes = await fetch('/api/contractors');
      if (cRes.ok) {
        const list = (await cRes.json()).contractors || [];
        setContractors(list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const mockEnvLogs = [
    {
      id: '1',
      mine: 'Jharia Prime Coking Mine 4',
      timestamp: '28/8/2026, 3:17:39 pm',
      pm: '150 / 248 ug/m3',
      waterPh: '72.2',
      noise: '40 dB',
      status: 'CRITICAL',
    },
    {
      id: '2',
      mine: 'Katas Opencast Project',
      timestamp: '28/8/2026, 3:17:07 pm',
      pm: '50 / 48 ug/m3',
      waterPh: '7.2',
      noise: '40 dB',
      status: 'NORMAL',
    },
    {
      id: '3',
      mine: 'Kusmunda Super Opencast Mine',
      timestamp: '28/8/2026, 3:16:26 pm',
      pm: '95 / 48 ug/m3',
      waterPh: '7.2',
      noise: '68 dB',
      status: 'NORMAL',
    },
    {
      id: '4',
      mine: 'Rajrappa Opencast Mine',
      timestamp: '28/8/2026, 1:25:29 pm',
      pm: '285 / 142 ug/m3',
      waterPh: '5.8',
      noise: '92 dB',
      status: 'CRITICAL',
    },
    {
      id: '5',
      mine: 'Sonepur Bazari OpenCast Project',
      timestamp: '28/8/2026, 1:25:29 pm',
      pm: '92 / 48.5 ug/m3',
      waterPh: '7.2',
      noise: '68.4 dB',
      status: 'NORMAL',
    },
  ];

  // Helper to generate worker employee cards for selected contractor
  const generateWorkerList = (contractor: any) => {
    if (!contractor) return [];
    const count = contractor.workerCount || 100;
    const companyName = contractor.companyName || '';

    const roles = [
      '240T Heavy Dumper Operator',
      'Hydraulic Shovel Operator',
      'HEMM Maintenance Engineer',
      'Pit Safety Marshal',
      'Blasting & Explosive Supervisor',
      'Haul Road Sprinkler Driver',
      'Dragline Operator',
    ];

    const prefix = companyName.toLowerCase().includes('bharat') ? 'WRK-BEH' : 'WRK-EME';
    const sampleNames = [
      'Rameshwar Mahato',
      'Subhash Chandra Das',
      'Bikash Kumar Roy',
      'Pankaj Sharma',
      'Manish Singh',
      'Gurpreet Singh',
      'Sanjay Kumar',
      'Amitava Mukhopadhyay',
      'Deepak Verma',
      'Pradeep Mondal',
      'Rajesh Paswan',
      'Vijay Bauri',
    ];

    const list = [];
    for (let i = 1; i <= count; i++) {
      const code = `${prefix}-${String(i).padStart(3, '0')}`;
      const name = sampleNames[(i - 1) % sampleNames.length] + (i > sampleNames.length ? ` #${Math.ceil(i / sampleNames.length)}` : '');
      const role = roles[(i - 1) % roles.length];
      list.push({
        id: `${prefix}-${i}`,
        workerCode: code,
        name,
        role,
        companyName,
        biometricStatus: i % 7 === 0 ? 'PENDING_REVERIFICATION' : 'VERIFIED_ACTIVE',
        formDStatus: 'COMPLIANT_REGISTERED',
        shift: i % 3 === 0 ? 'SHIFT_A (06:00 - 14:00)' : i % 3 === 1 ? 'SHIFT_B (14:00 - 22:00)' : 'SHIFT_C (22:00 - 06:00)',
      });
    }
    return list;
  };

  const currentWorkerRoster = selectedContractor ? generateWorkerList(selectedContractor) : [];
  const filteredWorkerRoster = currentWorkerRoster.filter(
    (w) =>
      w.name.toLowerCase().includes(workerSearchQuery.toLowerCase()) ||
      w.workerCode.toLowerCase().includes(workerSearchQuery.toLowerCase()) ||
      w.role.toLowerCase().includes(workerSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <HardHat className="w-5 h-5 text-amber-400" /> Contractor & Worker Governance Hub
          </h1>
          <p className="text-xs text-slate-400">
            Monitor contractor risk scores, safety compliance ratings, active excavating contracts & worker employee cards.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold">
          <span className="px-3 py-1.5 bg-amber-500 text-slate-950 font-extrabold rounded-lg">
            Contractor Directory & Worker Employee Cards
          </span>
        </div>
      </div>

      {/* Environmental Sensor Log Table Card */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl space-y-3 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                Mine Site Environmental Sensor Logs
              </h3>
              <p className="text-[11px] text-slate-400">Real-time PM10, PM2.5, Water pH & Noise dB levels recorded across mine operations.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800 font-bold">
            ● LIVE SENSOR FEED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Timestamp & Mine</th>
                <th className="py-3.5 px-4 font-mono">PM10 / PM2.5</th>
                <th className="py-3.5 px-4 font-mono">Water pH</th>
                <th className="py-3.5 px-4 font-mono">Noise dB</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {mockEnvLogs.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-xs">{r.mine}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.timestamp}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-extrabold text-amber-300">
                    {r.pm}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-blue-300 font-bold">
                    {r.waterPh}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-purple-300 font-bold">
                    {r.noise}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase border ${
                        r.status === 'CRITICAL'
                          ? 'bg-red-950 text-red-400 border-red-800 shadow-sm shadow-red-950'
                          : 'bg-emerald-950 text-emerald-400 border-emerald-800 shadow-sm shadow-emerald-950'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contractors Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contractors.map((c) => (
          <div key={c.id} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold text-base text-white">{c.companyName}</h3>
                <div className="text-xs text-amber-400 font-mono mt-0.5">{c.registrationNumber}</div>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  c.status === 'ACTIVE'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}
              >
                {c.status}
              </span>
            </div>

            {/* Metrics Grid with Interactive Clickable Worker Strength Box */}
            <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
              {/* CLICKABLE WORKER STRENGTH BOX */}
              <div
                onClick={() => setSelectedContractor(c)}
                className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500 p-2 rounded-lg cursor-pointer transition-all group"
                title="Click to view full Worker Employee Cards roster"
              >
                <span className="text-[10px] text-amber-400 uppercase font-bold block group-hover:underline flex items-center justify-center gap-1">
                  <Users className="w-3 h-3 text-amber-400" /> Worker Strength
                </span>
                <span className="text-base font-black text-amber-300 block mt-0.5">{c.workerCount} Workers</span>
                <span className="text-[9px] text-amber-400/80 font-semibold block">Click to View Cards →</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Safety Compliance</span>
                <span className="text-base font-black text-emerald-400 block mt-0.5">{c.complianceScore}%</span>
                <span className="text-[9px] text-emerald-500/80 block">DGMS Audited</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Risk Rating</span>
                <span className={`text-base font-black block mt-0.5 ${c.riskScore > 50 ? 'text-red-400' : 'text-amber-400'}`}>
                  {c.riskScore}/100
                </span>
                <span className="text-[9px] text-slate-500 block">AI Risk Index</span>
              </div>
            </div>

            {/* Contact info */}
            <div className="text-xs text-slate-300 space-y-1">
              <div>Contact Person: <span className="font-semibold text-white">{c.contactPerson}</span></div>
              <div>Email: <span className="text-slate-400">{c.email}</span></div>
            </div>

            {/* Active Contracts */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Contracts</span>
                <button
                  onClick={() => setSelectedContractor(c)}
                  className="text-xs text-amber-400 hover:underline font-bold flex items-center gap-1"
                >
                  View All {c.workerCount} Worker Employee Cards <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {c.contracts?.map((cnt: any) => (
                <div key={cnt.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{cnt.title}</div>
                    <div className="text-[10px] text-slate-400">{cnt.mine?.name || 'Coal Mine Pit'} • INR {cnt.value} Lakhs</div>
                  </div>
                  <span className="text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded font-mono border border-amber-800">
                    {cnt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Modal: Worker Employee Cards Roster */}
      {selectedContractor && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl space-y-4 p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-amber-400" /> {selectedContractor.companyName}
                </h2>
                <p className="text-xs text-slate-400">
                  {selectedContractor.workerCount} Registered Mining Worker Employee Cards & Biometric Registration Verification
                </p>
              </div>
              <button
                onClick={() => setSelectedContractor(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Counter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by worker code, name, or role..."
                  value={workerSearchQuery}
                  onChange={(e) => setWorkerSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">Showing: <strong className="text-amber-400 font-mono">{filteredWorkerRoster.length}</strong> of {selectedContractor.workerCount} Workers</span>
                <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-bold text-[10px]">
                  ● FORM D COMPLIANT
                </span>
              </div>
            </div>

            {/* Worker Employee Cards Grid */}
            <div className="overflow-y-auto max-h-[60vh] pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredWorkerRoster.map((w) => (
                <div key={w.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 hover:border-amber-500/40 transition-all space-y-2 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-amber-400 font-extrabold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                      {w.workerCode}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-full border border-emerald-800 flex items-center gap-1">
                      <Fingerprint className="w-3 h-3 text-emerald-400" /> {w.biometricStatus}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-white">{w.name}</h4>
                    <p className="text-[11px] text-amber-300 font-medium mt-0.5">{w.role}</p>
                  </div>

                  <div className="text-[10px] text-slate-400 space-y-1 pt-2 border-t border-slate-800/60">
                    <div className="flex justify-between">
                      <span>Shift Assignment:</span>
                      <span className="font-mono text-slate-300 font-semibold">{w.shift}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Statutory Form D:</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> REGISTERED
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
              <span>{selectedContractor.companyName} • Reg #{selectedContractor.registrationNumber}</span>
              <button
                onClick={() => setSelectedContractor(null)}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition-all shadow-md"
              >
                Close Worker Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
