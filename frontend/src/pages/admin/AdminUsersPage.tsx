import React, { useEffect, useState } from 'react';
import { Users, PlusCircle, Shield, CheckCircle, AlertTriangle, X } from 'lucide-react';
import api from '../../api/client.js';

export const AdminUsersPage: React.FC = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    platformRole: 'ADMIN',
  });

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/admin/users');
      setAdmins(res.data || []);
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', formData);
      setModalOpen(false);
      setFormData({ name: '', email: '', phone: '', password: '', platformRole: 'ADMIN' });
      fetchAdmins();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating administrator');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/toggle-status`);
      fetchAdmins();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error toggling admin status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142746] tracking-tight">
            Maamulka Platform-ka (Platform Administrators)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maamulayaasha loo xilsaaray socodsiinta iyo kormeerka nidaamka Maraayn
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-2 bg-brand-amber hover:bg-brand-amber-light text-brand-navy font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm self-start"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Ku Dar Maamule Cusub</span>
        </button>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
              <th className="py-3.5 px-4">Maamulaha</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Taleefanka</th>
              <th className="py-3.5 px-4">Xaaladda</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {admins.map((admin) => (
              <tr key={admin._id} className="hover:bg-slate-50/70">
                <td className="py-3.5 px-4">
                  <span className="font-bold text-slate-900 block">{admin.name}</span>
                  <span className="text-[11px] text-slate-500">{admin.email}</span>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      admin.platformRole === 'SUPER_ADMIN'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {admin.platformRole}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-600">{admin.phone || '-'}</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      admin.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {admin.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  {admin.platformRole !== 'SUPER_ADMIN' && (
                    <button
                      onClick={() => handleToggle(admin._id)}
                      className="px-2.5 py-1 border rounded-lg text-[10px] font-semibold hover:bg-slate-100"
                    >
                      {admin.status === 'ACTIVE' ? 'Xanib' : 'Fur'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Admin Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Ku Dar Maamule Cusub</h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Magaca Buuxa *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Taleefan *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Furaha Sirta ah (Password) *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="mt-5 flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-navy text-white rounded-xl font-bold hover:bg-brand-navy-light"
                >
                  Abuur Maamule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

