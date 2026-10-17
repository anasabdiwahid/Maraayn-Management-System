import React from 'react';
import { Settings, Shield, HardDrive, Bell } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#142746] tracking-tight">
          Platform Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Global policies and platform rules for Maraayn Management System
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs">
        <div>
          <h3 className="font-bold text-sm text-slate-900 border-b pb-2 mb-3">Default Storage Quota</h3>
          <p className="text-slate-500 mb-3">
            Initial storage space allocated to newly registered businesses:
          </p>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              defaultValue={4}
              className="w-24 p-2 bg-slate-50 border rounded-xl font-bold text-slate-800"
            />
            <span className="font-semibold text-slate-700">GB per business</span>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-sm text-slate-900 border-b pb-2 mb-3">Automatic Suspension Policy</h3>
          <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded text-brand-amber focus:ring-brand-amber" />
            <span className="font-medium">
              Automatically restrict write operations when a tenant reaches 100% storage quota until an admin increases it.
            </span>
          </label>
        </div>

        <div>
          <h3 className="font-bold text-sm text-slate-900 border-b pb-2 mb-3">Storage Quota Alert Thresholds</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-slate-600">
              <span className="w-20 font-bold">Level 1:</span>
              <span>Send warning alert to business when usage reaches 80%</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-600">
              <span className="w-20 font-bold">Level 2:</span>
              <span>Send critical alert when usage reaches 90%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

