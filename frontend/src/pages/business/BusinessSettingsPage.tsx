import React, { useEffect, useState } from 'react';
import {
  Settings,
  HardDrive,
  Palette,
  Printer,
  Users,
  CheckCircle,
  AlertCircle,
  Upload,
  Plus,
} from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { StorageMeter } from '../../components/common/StorageMeter.js';

export const BusinessSettingsPage: React.FC = () => {
  const { tenant, updateTenantData } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'receipt' | 'storage' | 'staff'>('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Storage info
  const [storageData, setStorageData] = useState<any>(null);

  // Staff info
  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    businessRole: 'CASHIER',
  });

  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    ownerPhone: tenant?.ownerPhone || '',
    location: tenant?.location || '',
    address: tenant?.address || '',
    primaryColor: tenant?.primaryColor || '#142746',
    accentColor: tenant?.accentColor || '#E6AE43',
    logoUrl: tenant?.logoUrl || '/logo.png',
    receiptSettings: {
      receiptTitle: tenant?.receiptSettings?.receiptTitle || tenant?.name || 'Receipt',
      footerMessage: tenant?.receiptSettings?.footerMessage || 'Waad ku mahadsantahay ganacsigaaga!',
      paperSize: tenant?.receiptSettings?.paperSize || 'thermal-80mm',
      showPhone: tenant?.receiptSettings?.showPhone ?? true,
      showAddress: tenant?.receiptSettings?.showAddress ?? true,
      showLogo: tenant?.receiptSettings?.showLogo ?? true,
    },
  });

  useEffect(() => {
    // Load storage meter
    api.get('/tenant/storage').then((res) => setStorageData(res.data));
    // Load staff
    api.get('/tenant/staff').then((res) => setStaffList(res.data || []));
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const res = await api.patch('/tenant/settings', formData);
      updateTenantData(res.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tenant/staff', staffForm);
      setStaffModalOpen(false);
      setStaffForm({ name: '', email: '', phone: '', password: '', businessRole: 'CASHIER' });
      api.get('/tenant/staff').then((res) => setStaffList(res.data || []));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error adding staff');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#142746] tracking-tight">
          Business Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage business profile, custom brand colors, receipt format, and staff members
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-bold text-slate-600">
        {[
          { id: 'profile', label: 'Profile & Branding' },
          { id: 'receipt', label: 'Receipt Format' },
          { id: 'storage', label: 'Storage Usage' },
          { id: 'staff', label: 'Staff & Roles' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-2 rounded-xl transition-all ${
              activeTab === t.id
                ? 'bg-brand-navy text-white shadow-sm font-extrabold'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile & Branding Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Business Phone *</label>
              <input
                type="text"
                required
                value={formData.ownerPhone}
                onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Downtown, Main Road..."
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Suite 104, Business Center..."
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
          </div>

          {/* Color Customization */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-3">
              Custom Brand Colors
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="p-2 bg-slate-50 border rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Accent Highlight Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border"
                  />
                  <input
                    type="text"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="p-2 bg-slate-50 border rounded-xl font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-brand-navy hover:bg-brand-navy-light text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}

      {/* Receipt Settings Tab */}
      {activeTab === 'receipt' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Receipt Title Header</label>
            <input
              type="text"
              value={formData.receiptSettings.receiptTitle}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  receiptSettings: { ...formData.receiptSettings, receiptTitle: e.target.value },
                })
              }
              className="w-full p-2.5 bg-slate-50 border rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Footer Message</label>
            <input
              type="text"
              value={formData.receiptSettings.footerMessage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  receiptSettings: { ...formData.receiptSettings, footerMessage: e.target.value },
                })
              }
              className="w-full p-2.5 bg-slate-50 border rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Paper Size</label>
            <select
              value={formData.receiptSettings.paperSize}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  receiptSettings: { ...formData.receiptSettings, paperSize: e.target.value as any },
                })
              }
              className="w-full p-2.5 bg-slate-50 border rounded-xl"
            >
              <option value="thermal-80mm">Thermal Printer (80mm) - Standard POS</option>
              <option value="thermal-58mm">Thermal Printer (58mm) - Small POS</option>
              <option value="a4">Standard Paper (A4 / Letter)</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-brand-navy hover:bg-brand-navy-light text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              Save Receipt Format
            </button>
          </div>
        </form>
      )}

      {/* Storage Usage Tab */}
      {activeTab === 'storage' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <StorageMeter
            usedBytes={storageData?.usedBytes || tenant?.storageUsedBytes || 0}
            quotaBytes={storageData?.quotaBytes || tenant?.storageQuotaBytes || 4 * 1024 * 1024 * 1024}
          />

          <div className="p-4 bg-slate-50 rounded-xl text-xs space-y-2 border border-slate-200">
            <h4 className="font-bold text-slate-800">Storage Quota Policy:</h4>
            <p className="text-slate-600">
              Your business workspace has been allocated an official quota of {( (tenant?.storageQuotaBytes || 0) / (1024 * 1024 * 1024) ).toFixed(1)} GB.
              Product catalog photos, branding assets, logos, and generated receipt records count towards this quota.
              If quota reaches 100%, new media uploads will be suspended until your administrator expands your storage limit.
            </p>
          </div>
        </div>
      )}

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Business Staff Members</h3>
              <p className="text-xs text-slate-500">Cashiers, Store Managers, and Accountants</p>
            </div>
            <button
              onClick={() => setStaffModalOpen(true)}
              className="flex items-center space-x-1.5 bg-brand-amber hover:bg-brand-amber-light text-brand-navy font-bold py-2 px-3 rounded-xl text-xs shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {staffList.map((s) => (
              <div key={s._id} className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">{s.name}</span>
                  <span className="text-slate-400">{s.email} • {s.phone || '-'}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700 text-[10px]">
                  {s.businessRole}
                </span>
              </div>
            ))}
          </div>

          {/* Add Staff Modal */}
          {staffModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border">
                <h4 className="font-bold text-sm mb-3">Add New Staff Member</h4>
                <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      placeholder="e.g., Ahmed Ali"
                      className="w-full p-2 bg-slate-50 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      placeholder="staff@example.com"
                      className="w-full p-2 bg-slate-50 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Role</label>
                    <select
                      value={staffForm.businessRole}
                      onChange={(e) => setStaffForm({ ...staffForm, businessRole: e.target.value })}
                      className="w-full p-2 bg-slate-50 border rounded-xl font-bold"
                    >
                      <option value="CASHIER">Cashier</option>
                      <option value="MANAGER">Store Manager</option>
                      <option value="INVENTORY_STAFF">Inventory Staff</option>
                      <option value="ACCOUNTANT">Accountant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Initial Password</label>
                    <input
                      type="password"
                      value={staffForm.password}
                      onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                      placeholder="Staff@2026"
                      className="w-full p-2 bg-slate-50 border rounded-xl"
                    />
                  </div>
                  <div className="pt-3 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setStaffModalOpen(false)}
                      className="px-3 py-1.5 border rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-brand-navy text-white rounded-xl font-bold"
                    >
                      Create Staff
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

