import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, PlusCircle, CheckCircle, AlertCircle, ArrowLeft, Upload, Key, ShieldCheck } from 'lucide-react';
import api from '../../api/client.js';

export const AddNewMarketPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Supermarket',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    location: 'Mogadishu',
    address: 'Maka Al-Mukarama Road',
    country: 'Somalia',
    logoUrl: '/logo.png',
    primaryColor: '#142746',
    accentColor: '#E6AE43',
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'Africa/Mogadishu',
    subscriptionPlan: 'Standard Business',
    storageQuotaGb: 4,
    initialStatus: 'ACTIVE',
    initialPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'storageQuotaGb' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/admin/markets', formData);
      setCreatedResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during market registration');
    } finally {
      setLoading(false);
    }
  };

  if (createdResult) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-md text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Market Registered Successfully!
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          The new business workspace has been provisioned with its allocated storage quota.
        </p>

        <div className="mt-6 bg-slate-50 p-6 rounded-xl border border-slate-200 text-left space-y-2 text-xs font-mono">
          <div className="flex justify-between border-b pb-2">
            <span className="text-slate-500">Market Name:</span>
            <span className="font-bold text-slate-900">{createdResult.market?.name}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-slate-500">Business Code:</span>
            <span className="font-bold text-brand-navy">{createdResult.market?.businessCode}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-slate-500">Owner Email:</span>
            <span className="font-bold text-slate-800">{createdResult.initialOwner?.email}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-slate-500">Username:</span>
            <span className="font-bold text-slate-800">{createdResult.initialOwner?.username}</span>
          </div>
          <div className="flex justify-between py-2 text-amber-800 font-bold">
            <span>Temporary Password:</span>
            <span>{createdResult.initialOwner?.initialPassword}</span>
          </div>
        </div>

        <div className="mt-6 flex justify-center space-x-3">
          <button
            onClick={() => navigate('/admin/markets')}
            className="px-5 py-2.5 bg-brand-navy text-white rounded-xl text-xs font-bold hover:bg-brand-navy-light transition-colors"
          >
            Back to Markets List
          </button>
          <button
            onClick={() => {
              setCreatedResult(null);
              setFormData({
                name: '',
                category: 'Supermarket',
                ownerName: '',
                ownerEmail: '',
                ownerPhone: '',
                location: 'Mogadishu',
                address: 'Maka Al-Mukarama Road',
                country: 'Somalia',
                logoUrl: '/logo.png',
                primaryColor: '#142746',
                accentColor: '#E6AE43',
                currency: 'USD',
                currencySymbol: '$',
                timezone: 'Africa/Mogadishu',
                subscriptionPlan: 'Standard Business',
                storageQuotaGb: 4,
                initialStatus: 'ACTIVE',
                initialPassword: '',
              });
            }}
            className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            Register Another Market
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/admin/markets')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#142746] tracking-tight">
            Register New Market
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fill in the business details to create an isolated workspace and administrator account
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Section 1: Business Profile */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy border-b pb-2 mb-4">
            1. Business Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Market / Business Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Al-Huda Supermarket"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-amber focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Business Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-amber focus:bg-white font-semibold"
              >
                <option value="Supermarket">Supermarket</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Retail Shop">Retail Shop</option>
                <option value="Restaurant & Café">Restaurant & Café</option>
                <option value="Clothing & Fashion">Clothing & Fashion</option>
                <option value="Electronics & Hardware">Electronics & Hardware</option>
                <option value="Wholesale Business">Wholesale Business</option>
                <option value="General Trading">General Trading</option>
                <option value="Other Category">Other Category</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">City / Region (Location)</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Mogadishu, Hargeisa, Kismayo..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-amber focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="District, Street..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-amber focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Owner Details */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy border-b pb-2 mb-4">
            2. Owner Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Owner Full Name *</label>
              <input
                type="text"
                name="ownerName"
                required
                value={formData.ownerName}
                onChange={handleChange}
                placeholder="Ahmed Mohamed Ali"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-amber focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Owner Email *</label>
              <input
                type="email"
                name="ownerEmail"
                required
                value={formData.ownerEmail}
                onChange={handleChange}
                placeholder="owner@domain.com"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-amber focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Owner Phone *</label>
              <input
                type="text"
                name="ownerPhone"
                required
                value={formData.ownerPhone}
                onChange={handleChange}
                placeholder="+25261..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-amber focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Storage Quota & Subscription */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy border-b pb-2 mb-4">
            3. Storage Quota & Plan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Storage Quota (GB) *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                name="storageQuotaGb"
                required
                value={formData.storageQuotaGb}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-amber focus:bg-white font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: 4 GB</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Subscription Plan</label>
              <select
                name="subscriptionPlan"
                value={formData.subscriptionPlan}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-amber focus:bg-white"
              >
                <option value="Starter Business">Starter Business (2 GB)</option>
                <option value="Standard Business">Standard Business (4 GB)</option>
                <option value="Growth Plan">Growth Plan (10 GB)</option>
                <option value="Enterprise">Enterprise (50 GB)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Initial Status</label>
              <select
                name="initialStatus"
                value={formData.initialStatus}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-amber focus:bg-white font-bold"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="DISABLED">DISABLED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Initial Password */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy border-b pb-2 mb-4">
            4. Account Security
          </h3>
          <div className="max-w-md text-xs">
            <label className="block font-bold text-slate-700 mb-1">
              Initial Password (Optional)
            </label>
            <input
              type="text"
              name="initialPassword"
              value={formData.initialPassword}
              onChange={handleChange}
              placeholder="Leave empty for auto-generated password (Maraayn@2026)"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-amber focus:bg-white"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/markets')}
            className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-brand-amber hover:bg-brand-amber-light text-brand-navy rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-amber/20 disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Complete Registration'}
          </button>
        </div>
      </form>
    </div>
  );
};

