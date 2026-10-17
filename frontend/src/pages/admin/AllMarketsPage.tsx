import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Store,
  Search,
  Filter,
  PlusCircle,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sliders,
  X,
  ExternalLink,
} from 'lucide-react';
import api from '../../api/client.js';
import { StorageMeter } from '../../components/common/StorageMeter.js';

export const AllMarketsPage: React.FC = () => {
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal states
  const [selectedMarket, setSelectedMarket] = useState<any>(null);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [newQuotaGb, setNewQuotaGb] = useState<number>(4);

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/markets', {
        params: {
          search: search || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        },
      });
      setMarkets(res.data.data || []);
    } catch (err) {
      console.error('Failed to load markets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMarkets();
  };

  const handleSuspend = async () => {
    if (!selectedMarket || !suspendReason) return;
    try {
      await api.post(`/admin/markets/${selectedMarket._id}/suspend`, {
        reason: suspendReason,
      });
      setSuspendModalOpen(false);
      setSuspendReason('');
      fetchMarkets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error suspending market');
    }
  };

  const handleReactivate = async (id: string) => {
    if (!confirm('Are you sure you want to reactivate this market?')) return;
    try {
      await api.post(`/admin/markets/${id}/reactivate`);
      fetchMarkets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error reactivating market');
    }
  };

  const handleQuotaUpdate = async () => {
    if (!selectedMarket || newQuotaGb < 0.5) return;
    try {
      await api.patch(`/admin/markets/${selectedMarket._id}/storage-quota`, {
        quotaGb: newQuotaGb,
      });
      setQuotaModalOpen(false);
      fetchMarkets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating quota');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142746] tracking-tight">
            Manage Markets
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            List of all independent businesses operating on the Maraayn platform
          </p>
        </div>

        <NavLink
          to="/admin/markets/new"
          className="flex items-center space-x-2 bg-brand-amber hover:bg-brand-amber-light text-brand-navy font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm self-start"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Market</span>
        </NavLink>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, owner, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-amber focus:bg-white"
          />
        </form>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="DISABLED">DISABLED</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Supermarket">Supermarket</option>
            <option value="Pharmacy">Pharmacy</option>
            <option value="Retail Shop">Retail Shop</option>
            <option value="Restaurant & Café">Restaurant & Café</option>
            <option value="Clothing & Fashion">Clothing & Fashion</option>
            <option value="Electronics & Hardware">Electronics</option>
            <option value="Wholesale Business">Wholesale</option>
          </select>
        </div>
      </div>

      {/* Markets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Market / Business</th>
                <th className="py-3.5 px-4">Owner & Contact</th>
                <th className="py-3.5 px-4">Category & Location</th>
                <th className="py-3.5 px-4">Storage Meter</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading markets, please wait...
                  </td>
                </tr>
              ) : markets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No businesses found matching the criteria.
                  </td>
                </tr>
              ) : (
                markets.map((m) => {
                  const quotaGb = (m.storageQuotaBytes || 0) / (1024 * 1024 * 1024);
                  const usedMb = ((m.storageUsedBytes || 0) / (1024 * 1024)).toFixed(0);
                  const percent = quotaGb > 0 ? Math.round((m.storageUsedBytes / m.storageQuotaBytes) * 100) : 0;

                  return (
                    <tr key={m._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={m.logoUrl || '/logo.png'}
                            alt={m.name}
                            className="w-10 h-10 rounded-xl object-contain bg-slate-50 border p-1 shrink-0"
                            onError={(e) => ((e.target as any).src = '/logo.png')}
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{m.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{m.businessCode}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{m.ownerName}</p>
                        <p className="text-[11px] text-slate-500">{m.ownerEmail}</p>
                        <p className="text-[10px] text-slate-400">{m.ownerPhone}</p>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                          {m.category}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{m.location || 'Mogadishu'}</p>
                      </td>

                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-1">
                          <span>{usedMb} MB</span>
                          <span>{quotaGb.toFixed(1)} GB ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              percent >= 90 ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.status === 'SUSPENDED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        {/* Adjust Quota */}
                        <button
                          onClick={() => {
                            setSelectedMarket(m);
                            setNewQuotaGb(m.storageQuotaBytes / (1024 * 1024 * 1024));
                            setQuotaModalOpen(true);
                          }}
                          title="Modify Storage Quota"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                        >
                          <HardDrive className="w-3.5 h-3.5" />
                        </button>

                        {/* Suspend or Reactivate */}
                        {m.status === 'ACTIVE' ? (
                          <button
                            onClick={() => {
                              setSelectedMarket(m);
                              setSuspendReason('');
                              setSuspendModalOpen(true);
                            }}
                            title="Suspend Market"
                            className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(m._id)}
                            title="Reactivate Market"
                            className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend Modal */}
      {suspendModalOpen && selectedMarket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Suspend Market: {selectedMarket.name}</span>
              </h3>
              <button onClick={() => setSuspendModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-600">
                When suspended, this market cannot record new sales or upload files. All data remains safely intact.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Suspension Reason
                </label>
                <textarea
                  rows={3}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g. Storage quota exceeded or administrative review..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-amber"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                onClick={() => setSuspendModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={!suspendReason}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quota Modal */}
      {quotaModalOpen && selectedMarket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-brand-navy" />
                <span>Change Quota: {selectedMarket.name}</span>
              </h3>
              <button onClick={() => setQuotaModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-600">
                Enter the new quota in Gigabytes (GB). If the market was locked due to storage limit, increasing it will automatically re-enable operations.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Storage Quota (GB)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={newQuotaGb}
                  onChange={(e) => setNewQuotaGb(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-amber"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                onClick={() => setQuotaModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleQuotaUpdate}
                className="px-4 py-2 bg-brand-navy hover:bg-brand-navy-light text-white rounded-xl text-xs font-bold transition-colors"
              >
                Save Quota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

