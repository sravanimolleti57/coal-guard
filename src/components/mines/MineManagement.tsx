'use client';

import React, { useEffect, useState } from 'react';
import { Building2, MapPin, Plus, Search, CheckCircle, AlertTriangle, Layers, Edit2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function MineManagement() {
  const { user } = useAuth();
  const [mines, setMines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMine, setSelectedMine] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    subsidiaryId: '',
    state: 'Jharkhand',
    district: 'Dhanbad',
    mineType: 'OPENCAST',
    productionTarget: '10.0',
    contactName: '',
    contactEmail: '',
  });

  useEffect(() => {
    fetchMines();
  }, [search]);

  const fetchMines = async () => {
    setLoading(true);
    try {
      let url = '/api/mines';
      if (search) url += `?search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setMines(json.mines || []);
        if (json.mines?.length > 0 && !selectedMine) {
          setSelectedMine(json.mines[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load mines:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Find default subsidiary ID if missing
      let subId = formData.subsidiaryId;
      if (!subId && mines.length > 0) {
        subId = mines[0].subsidiaryId;
      }
      const res = await fetch('/api/mines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, subsidiaryId: subId }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        fetchMines();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" /> Mine Operations & Subsidiary Registry
          </h1>
          <p className="text-xs text-slate-400">
            Manage multi-mine operational parameters, statutory codes, mine zones & contact officials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search mine name, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none w-56"
            />
          </div>

          {user?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Mine
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mine List Column */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
            Registered Coal Mines ({mines.length})
          </h3>

          {loading ? (
            <p className="text-xs text-slate-500 py-4">Loading mines...</p>
          ) : (
            mines.map((m) => {
              const isSelected = selectedMine?.id === m.id;
              const risk = m.riskScores[0]?.riskLevel || 'LOW';
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMine(m)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-white">{m.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        risk === 'CRITICAL'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : risk === 'HIGH'
                          ? 'bg-orange-950 text-orange-400 border border-orange-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {risk} RISK
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                    <span>{m.subsidiary.code} • {m.mineType}</span>
                    <span className="text-slate-300 font-medium">{m.district}, {m.state}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Mine Profile Detail Panel */}
        <div className="lg:col-span-2">
          {selectedMine ? (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-white">{selectedMine.name}</h2>
                    <span className="text-xs bg-slate-800 text-amber-400 font-mono px-2 py-0.5 rounded border border-slate-700">
                      {selectedMine.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {selectedMine.district}, {selectedMine.state} ({selectedMine.latitude.toFixed(4)}°N, {selectedMine.longitude.toFixed(4)}°E)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-3 py-1 bg-emerald-950 text-emerald-400 rounded-full border border-emerald-800">
                    {selectedMine.status}
                  </span>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Subsidiary</span>
                  <div className="text-sm font-bold text-white mt-1">{selectedMine.subsidiary.code}</div>
                  <div className="text-[10px] text-slate-500">{selectedMine.subsidiary.name}</div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Mine Type</span>
                  <div className="text-sm font-bold text-amber-400 mt-1">{selectedMine.mineType}</div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Annual Target</span>
                  <div className="text-sm font-bold text-white mt-1">{selectedMine.productionTarget} MT</div>
                  <div className="text-[10px] text-slate-500">Million Tonnes / Year</div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Active Violations</span>
                  <div className="text-sm font-bold text-red-400 mt-1">{selectedMine._count?.violations || 0}</div>
                </div>
              </div>

              {/* Zones List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" /> Operational Pit Zones ({selectedMine.zones?.length || 0})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedMine.zones?.map((z: any) => (
                    <div key={z.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{z.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{z.code}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          z.riskLevel === 'CRITICAL' || z.riskLevel === 'HIGH'
                            ? 'bg-red-950 text-red-400'
                            : 'bg-emerald-950 text-emerald-400'
                        }`}
                      >
                        {z.riskLevel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
              Select a mine to view operational specifications.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Mine */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Register New Coal Mine</h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Mine Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sonepur Bazari Opencast"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Mine Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. SBN-OCP-99"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Mine Type</label>
                  <select
                    value={formData.mineType}
                    onChange={(e) => setFormData({ ...formData, mineType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="OPENCAST">OPENCAST</option>
                    <option value="UNDERGROUND">UNDERGROUND</option>
                    <option value="MIXED">MIXED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 shadow-md"
                >
                  Create Mine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
