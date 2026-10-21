import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Store,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Users,
  TrendingUp,
  PlusCircle,
  Clock,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import api from '../../api/client.js';
import { StatCard } from '../../components/common/StatCard.js';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRecentMarkets, setShowRecentMarkets] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<any | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 sm:h-32 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full min-w-0 max-w-full overflow-hidden">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142746] tracking-tight">
            Maraayn Control Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Platform overview of all businesses (Markets) registered on Maraayn
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <NavLink
            to="/admin/markets/new"
            className="flex items-center space-x-2 bg-brand-amber hover:bg-brand-amber-light text-brand-navy font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register New Market</span>
          </NavLink>
        </div>
      </div>

      {/* KPI Stat Cards (2x2 on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatCard
          title="Total Markets"
          value={stats?.totalMarkets || 0}
          subtitle="All registered businesses"
          icon={Store}
          color="navy"
        />
        <StatCard
          title="Active Markets"
          value={stats?.activeMarkets || 0}
          subtitle="Currently operational businesses"
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Suspended / Disabled"
          value={(stats?.suspendedMarkets || 0) + (stats?.disabledMarkets || 0)}
          subtitle={`${stats?.suspendedMarkets || 0} suspended, ${stats?.disabledMarkets || 0} disabled`}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Storage Utilized"
          value={`${stats?.totalUsedGb || 0} GB`}
          subtitle={`Allocated: ${stats?.totalAllocatedGb || 0} GB`}
          icon={HardDrive}
          color="amber"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full min-w-0">
        {/* Market Registration Growth */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Registration Growth Trend</h3>
              <p className="text-xs text-slate-400">New businesses joined per month</p>
            </div>
            <TrendingUp className="w-4 h-4 text-brand-amber" />
          </div>

          <div className="h-64 w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.monthlyGrowth || []}>
                <defs>
                  <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E6AE43" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#E6AE43" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#142746', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="registrations"
                  stroke="#E6AE43"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRegistrations)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Business Category Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Business Categories</h3>
              <p className="text-xs text-slate-400">Supermarket, Pharmacy, Retail, etc.</p>
            </div>
            <Store className="w-4 h-4 text-brand-navy" />
          </div>

          <div className="h-64 w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.categoryDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#142746', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#142746" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Lists: Recently Registered Markets & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full min-w-0">
        {/* Recent Markets */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-800">Recent Markets</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {stats?.recentMarkets?.length || 0}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowRecentMarkets(!showRecentMarkets)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#142746] text-white hover:bg-[#1a3868] transition-all shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showRecentMarkets ? 'Hide' : 'Show'}</span>
                {showRecentMarkets ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <NavLink to="/admin/markets" className="text-xs font-semibold text-brand-navy hover:underline flex items-center">
                <span>View All</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </NavLink>
            </div>
          </div>

          {showRecentMarkets ? (
            <div className="divide-y divide-slate-100 animate-fadeIn">
              {stats?.recentMarkets?.map((m: any) => {
                const quotaGb = (m.storageQuotaBytes || 0) / (1024 * 1024 * 1024);
                const usedMb = ((m.storageUsedBytes || 0) / (1024 * 1024)).toFixed(0);

                return (
                  <div
                    key={m._id}
                    onClick={() => setSelectedMarket(m)}
                    className="py-3 px-2 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50/80 rounded-xl transition-colors group"
                    title="Click to view market details"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={m.logoUrl || '/logo.png'}
                        alt={m.name}
                        className="w-9 h-9 rounded-lg object-contain bg-slate-50 border p-1 group-hover:scale-105 transition-transform"
                        onError={(e) => ((e.target as any).src = '/logo.png')}
                      />
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-brand-navy">{m.name}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{m.businessCode} • {m.category}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.status === 'SUSPENDED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {m.status}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">{usedMb}MB / {quotaGb.toFixed(0)}GB</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div 
              onClick={() => setShowRecentMarkets(true)}
              className="py-8 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-[#142746] hover:bg-slate-50/70 transition-all group"
            >
              <Store className="w-8 h-8 text-slate-300 mx-auto group-hover:text-[#142746] transition-colors" />
              <p className="mt-2 text-xs font-bold text-slate-600">Recent Markets are hidden</p>
              <button
                type="button"
                className="mt-2 inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#142746] rounded-lg hover:bg-[#1a3868] transition-colors shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Show Recent Markets ({stats?.recentMarkets?.length || 0})</span>
              </button>
            </div>
          )}
        </div>

        {/* Administrative Audit Logs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Administrative Activity Trail</h3>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((act: any) => (
                <div key={act._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex justify-between items-start">
                  <div>
                    <span className="font-bold text-brand-navy">{act.action.replace('_', ' ')}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      By <span className="font-semibold text-slate-700">{act.userName}</span> ({act.userRole})
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(act.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">No activity logs recorded yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Market Details Modal (When clicked / Show is invoked) */}
      {selectedMarket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-scaleUp">
            <button
              type="button"
              onClick={() => setSelectedMarket(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4 mb-5">
              <img
                src={selectedMarket.logoUrl || '/logo.png'}
                alt={selectedMarket.name}
                className="w-14 h-14 rounded-2xl object-contain bg-slate-50 border p-2 shadow-sm"
                onError={(e) => ((e.target as any).src = '/logo.png')}
              />
              <div>
                <h3 className="text-lg font-extrabold text-[#142746]">{selectedMarket.name}</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedMarket.businessCode} • {selectedMarket.category}</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Status:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                    selectedMarket.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedMarket.status === 'SUSPENDED'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedMarket.status}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Storage Quota:</span>
                <span className="font-bold text-slate-700">
                  {((selectedMarket.storageUsedBytes || 0) / (1024 * 1024)).toFixed(0)}MB / {((selectedMarket.storageQuotaBytes || 0) / (1024 * 1024 * 1024)).toFixed(0)}GB
                </span>
              </div>

              {selectedMarket.contactEmail && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Email:</span>
                  <span className="font-bold text-slate-700">{selectedMarket.contactEmail}</span>
                </div>
              )}

              {selectedMarket.contactPhone && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Phone:</span>
                  <span className="font-bold text-slate-700">{selectedMarket.contactPhone}</span>
                </div>
              )}

              {selectedMarket.createdAt && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Registered:</span>
                  <span className="font-bold text-slate-700">{new Date(selectedMarket.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="mt-5 flex space-x-3">
              <NavLink
                to={`/admin/markets`}
                className="flex-1 text-center py-2.5 rounded-xl bg-[#142746] text-white font-bold text-xs hover:bg-[#1a3868] transition-colors shadow-sm"
              >
                Manage Markets
              </NavLink>
              <button
                type="button"
                onClick={() => setSelectedMarket(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

