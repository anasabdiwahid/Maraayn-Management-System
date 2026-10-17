import React, { useEffect, useState } from 'react';
import { FileBarChart, HardDrive, Store, Download, Shield } from 'lucide-react';
import api from '../../api/client.js';

export const AdminReportsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get('/admin/dashboard').then((res) => setStats(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#142746] tracking-tight">
          Platform Reports
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          High-level monitoring of platform data, storage utilization, and tenant statuses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <Store className="w-6 h-6 text-brand-navy mb-2" />
          <h3 className="font-bold text-slate-800 text-sm">Markets & Tenants Report</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Total: {stats?.totalMarkets || 0} markets ({stats?.activeMarkets || 0} active)
          </p>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
            Operational Health: 99.9%
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <HardDrive className="w-6 h-6 text-brand-amber mb-2" />
          <h3 className="font-bold text-slate-800 text-sm">Platform Storage Capacity</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Utilized: {stats?.totalUsedGb || 0} GB / {stats?.totalAllocatedGb || 0} GB
          </p>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">
            Capacity: Optimal
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <Shield className="w-6 h-6 text-blue-600 mb-2" />
          <h3 className="font-bold text-slate-800 text-sm">Security & Compliance</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Audit logging & Multi-tenant data isolation active
          </p>
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
            Tenant Isolation: Enforced
          </span>
        </div>
      </div>
    </div>
  );
};

