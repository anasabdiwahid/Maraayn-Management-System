import React, { useEffect, useState } from 'react';
import {
  Users,
  PlusCircle,
  Shield,
  CheckCircle2,
  AlertTriangle,
  X,
  Pencil,
  Trash2,
  Ban,
  Mail,
  Phone,
  Lock,
  Search,
} from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';



export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
  const [statusTargetAdmin, setStatusTargetAdmin] = useState<any | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    platformRole: 'ADMIN',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    platformRole: 'ADMIN',
    status: 'ACTIVE',
    password: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [alertNotice, setAlertNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertNotice({ type, message });
    setTimeout(() => setAlertNotice(null), 4000);
  };

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/admin/users');
      setAdmins(res.data || []);
    } catch (err: any) {
      console.error('Failed to load admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Handle Create Admin
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/admin/users', createForm);
      setCreateModalOpen(false);
      setCreateForm({ name: '', email: '', phone: '', password: '', platformRole: 'ADMIN' });
      showAlert('success', 'Maamulaha cusub si guul leh ayaa loo abuuray!');
      fetchAdmins();
    } catch (err: any) {
      showAlert('error', err.response?.data?.message || 'Khalad ayaa dhacay markii la abuurayay maamulaha');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Open Edit Modal
  const openEditModal = (admin: any) => {
    setSelectedAdmin(admin);
    setEditForm({
      name: admin.name || '',
      email: admin.email || '',
      phone: admin.phone || '',
      platformRole: admin.platformRole || 'ADMIN',
      status: admin.status || 'ACTIVE',
      password: '',
    });
    setEditModalOpen(true);
  };

  // Handle Submit Edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    setActionLoading(true);

    try {
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        platformRole: editForm.platformRole,
        status: editForm.status,
      };
      if (editForm.password && editForm.password.trim().length >= 6) {
        payload.password = editForm.password.trim();
      }

      await api.patch(`/admin/users/${selectedAdmin._id}`, payload);
      setEditModalOpen(false);
      setSelectedAdmin(null);
      showAlert('success', 'Xogta maamulaha si guul leh ayaa loo cusbooneysiiyay!');
      fetchAdmins();
    } catch (err: any) {
      showAlert('error', err.response?.data?.message || 'Khalad ayaa dhacay markii la wax laga beddelayay maamulaha');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Open Status Toggle Modal (In-page message, no browser alert)
  const openStatusModal = (admin: any) => {
    setStatusTargetAdmin(admin);
    setStatusModalOpen(true);
  };

  // Handle Confirm Toggle Status
  const handleToggle = async () => {
    if (!statusTargetAdmin) return;
    setActionLoading(true);

    try {
      await api.patch(`/admin/users/${statusTargetAdmin._id}/toggle-status`);
      const newStatus = statusTargetAdmin.status === 'ACTIVE' ? 'la xanibay (Deactivated)' : 'la furay (Activated)';
      showAlert('success', `Xaaladda maamulaha ${statusTargetAdmin.name} si guul leh ayaa loo ${newStatus}!`);
      setStatusModalOpen(false);
      setStatusTargetAdmin(null);
      fetchAdmins();
    } catch (err: any) {
      showAlert('error', err.response?.data?.message || 'Khalad ayaa dhacay markii xaaladda la beddelayay');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Open Delete Modal
  const openDeleteModal = (admin: any) => {
    setSelectedAdmin(admin);
    setDeleteModalOpen(true);
  };

  // Handle Submit Delete
  const handleDelete = async () => {
    if (!selectedAdmin) return;
    setActionLoading(true);

    try {
      await api.delete(`/admin/users/${selectedAdmin._id}`);
      setDeleteModalOpen(false);
      setSelectedAdmin(null);
      showAlert('success', 'Maamulaha si buuxda ayaa loo tirtiray!');
      fetchAdmins();
    } catch (err: any) {
      showAlert('error', err.response?.data?.message || 'Ma suurtogalin in la tirtiro maamulahan');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAdmins = admins.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.phone?.toLowerCase().includes(search.toLowerCase()) ||
      a.platformRole?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = admins.filter((a) => a.status === 'ACTIVE').length;
  const suspendedCount = admins.filter((a) => a.status !== 'ACTIVE').length;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full overflow-hidden">
      {/* Toast Alert Notice */}
      {alertNotice && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-md transition-all ${
            alertNotice.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-rose-500 text-white'
          }`}
        >
          <span>{alertNotice.message}</span>
          <button onClick={() => setAlertNotice(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142746] tracking-tight">
            Maamulka Platform-ka (Platform Administrators)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maamulayaasha xilka u haya kormeerka, xakamaynta, iyo socodsiinta nidaamka Maraayn
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center space-x-2 bg-brand-amber hover:bg-brand-amber-light text-brand-navy font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm self-start"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Ku Dar Maamule Cusub</span>
        </button>
      </div>

      {/* Quick Stats & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Wadarta Maamulayaasha</p>
            <p className="text-lg font-extrabold text-[#142746]">{admins.length}</p>
          </div>
          <Users className="w-6 h-6 text-brand-navy" />
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase">Active (Shaqeynaya)</p>
            <p className="text-lg font-extrabold text-emerald-700">{activeCount}</p>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-rose-600 uppercase">Deactive / Xaniban</p>
            <p className="text-lg font-extrabold text-rose-700">{suspendedCount}</p>
          </div>
          <Ban className="w-6 h-6 text-rose-600" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Raadi maamule magac, email, taleefan ama role..."
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy shadow-sm"
        />
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  Xogta maamulayaasha ayaa la soo rarayaa...
                </td>
              </tr>
            ) : filteredAdmins.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  Wax maamule ah lama helin
                </td>
              </tr>
            ) : (
              filteredAdmins.map((admin) => {
                const isSelf = currentUser?.id === admin._id || (currentUser as any)?._id === admin._id;
                const isSuperAdmin = admin.platformRole === 'SUPER_ADMIN';

                return (
                  <tr key={admin._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-[#142746] font-extrabold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                          {admin.name?.slice(0, 2).toUpperCase() || 'AD'}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">
                            {admin.name}
                            {isSelf && (
                              <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">
                                adiga
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate block">{admin.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                          isSuperAdmin ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}
                      >
                        {admin.platformRole}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {admin.phone || '-'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          admin.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            admin.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {admin.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(admin)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center space-x-1"
                          title="Wax ka beddel (Edit)"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        {/* Active / Deactive Toggle Button */}
                        {!isSelf && (
                          <button
                            onClick={() => openStatusModal(admin)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors flex items-center space-x-1 ${
                              admin.status === 'ACTIVE'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                            }`}
                            title={admin.status === 'ACTIVE' ? 'Xanib (Deactivate)' : 'Fur (Activate)'}
                          >
                            {admin.status === 'ACTIVE' ? (
                              <>
                                <Ban className="w-3 h-3" />
                                <span>Xanib</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Fur</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Delete Button */}
                        {!isSelf && (
                          <button
                            onClick={() => openDeleteModal(admin)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors flex items-center space-x-1"
                            title="Tirtir (Delete)"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS VIEW (Eliminates horizontal scrolling/dragging on mobile) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-6 bg-white rounded-2xl border text-center text-xs text-slate-400">
            Xogta maamulayaasha ayaa la soo rarayaa...
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="p-6 bg-white rounded-2xl border text-center text-xs text-slate-400">
            Wax maamule ah lama helin
          </div>
        ) : (
          filteredAdmins.map((admin) => {
            const isSelf = currentUser?.id === admin._id || (currentUser as any)?._id === admin._id;
            const isSuperAdmin = admin.platformRole === 'SUPER_ADMIN';

            return (
              <div key={admin._id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                {/* Header: Avatar, Name, Email, Role */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-[#142746] font-extrabold flex items-center justify-center text-sm shrink-0 border border-slate-200">
                      {admin.name?.slice(0, 2).toUpperCase() || 'AD'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm text-slate-900 truncate">
                        {admin.name}
                        {isSelf && (
                          <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">
                            adiga
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 truncate flex items-center space-x-1 mt-0.5">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate">{admin.email}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                      isSuperAdmin ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-blue-100 text-blue-900 border border-blue-200'
                    }`}
                  >
                    {admin.platformRole}
                  </span>
                </div>

                {/* Details row: Phone and Status */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-600 font-mono text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{admin.phone || 'Taleefan ma jiro'}</span>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      admin.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        admin.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    {admin.status}
                  </span>
                </div>

                {/* Action Buttons Row */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(admin)}
                    className="w-full py-2 text-xs font-bold rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => openStatusModal(admin)}
                    disabled={isSelf}
                    className={`w-full py-2 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center space-x-1 ${
                      isSelf
                        ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200'
                        : admin.status === 'ACTIVE'
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                    }`}
                  >
                    {admin.status === 'ACTIVE' ? (
                      <>
                        <Ban className="w-3.5 h-3.5" />
                        <span>Xanib</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Fur</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => openDeleteModal(admin)}
                    disabled={isSelf}
                    className={`w-full py-2 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center space-x-1 ${
                      isSelf
                        ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200'
                        : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE ADMIN MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <Users className="w-4 h-4 text-brand-navy" />
                <span>Ku Dar Maamule Cusub</span>
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Magaca Buuxa *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hassan Mohamed"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:border-brand-navy outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="hassan@maraayn.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:border-brand-navy outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Taleefan (Phone) *</label>
                <input
                  type="text"
                  required
                  placeholder="+252 61 XXXXXXX"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:border-brand-navy outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role-ka *</label>
                <select
                  value={createForm.platformRole}
                  onChange={(e) => setCreateForm({ ...createForm, platformRole: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:border-brand-navy outline-none font-semibold"
                >
                  <option value="ADMIN">ADMIN (Platform Administrator)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Platform Owner)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Furaha Sirta ah (Password) *</label>
                <input
                  type="password"
                  required
                  placeholder="Ugu yaraan 6 xaraf ama lambar"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:border-brand-navy outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-brand-navy text-white rounded-xl font-bold hover:bg-brand-navy-light transition-colors shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Waa la abuurayaa...' : 'Abuur Maamule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ADMIN MODAL */}
      {editModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                <span>Wax Ka Beddel Maamulaha: {selectedAdmin.name}</span>
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Magaca Buuxa *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:border-brand-navy outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:border-brand-navy outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Taleefan (Phone)</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:border-brand-navy outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role-ka</label>
                  <select
                    value={editForm.platformRole}
                    onChange={(e) => setEditForm({ ...editForm, platformRole: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:border-brand-navy outline-none font-semibold"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Xaaladda (Status)</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:border-brand-navy outline-none font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE (Shaqeynaya)</option>
                    <option value="SUSPENDED">SUSPENDED (Xaniban)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Furaha Cusub (Password) <span className="text-[10px] text-slate-400 font-normal">(U dhaaf maran haddii aadan rabin inaad beddesho)</span>
                </label>
                <input
                  type="password"
                  placeholder="Gali furaha cusub haddii la rabo"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:border-brand-navy outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Waa la keydinayaa...' : 'Keydi Isbeddelka'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATUS TOGGLE CONFIRMATION MODAL (EXACT AUTHENTIC PAPER CARD WITH BINDER CLIP & X BUTTON) */}
      {statusModalOpen && statusTargetAdmin && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="relative max-w-xl w-full mx-auto select-none my-auto animate-scaleUp">
            {/* The Authentic Lined Paper Card with Binder Clip Image */}
            <img
              src="/binder-paper-card.png"
              alt="Maraayn Notice Card"
              className="w-full h-auto drop-shadow-2xl select-none block pointer-events-none"
            />

            {/* Seamless Content Overlay calibrated directly onto the paper lines */}
            <div className="absolute inset-0">
              {/* Top Row: Maraayn Branding & 'X' Close Button (Safely inside paper top margin) */}
              <div className="absolute top-[24%] left-[8%] right-[8%] flex items-center justify-between">
                <div className="flex items-center space-x-2 max-w-[180px] sm:max-w-[220px]">
                  <img src="/logo.png" alt="Maraayn" className="h-6 sm:h-7 object-contain shrink-0" />
                  <div className="min-w-0">
                    <div className="font-black text-[11px] sm:text-sm text-[#142746] leading-tight truncate">
                      Maraayn System
                    </div>
                    <div className="text-[8px] sm:text-[9px] text-brand-amber font-extrabold uppercase tracking-wider">
                      {statusTargetAdmin.status === 'ACTIVE'
                        ? 'Ogeysiis Xanibaad'
                        : 'Ogeysiis Furitaan'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStatusModalOpen(false);
                    setStatusTargetAdmin(null);
                  }}
                  className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors z-20 cursor-pointer"
                  title="Ka Noqo (Close)"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Line Row 1: Status Title Badge centered between lines */}
              <div className="absolute top-[33.5%] left-[8%] right-[8%] h-[9.8%] flex items-center justify-center">
                <div
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full font-extrabold text-[11px] sm:text-xs md:text-sm shadow-xs backdrop-blur-xs border ${
                    statusTargetAdmin.status === 'ACTIVE'
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-800'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800'
                  }`}
                >
                  {statusTargetAdmin.status === 'ACTIVE' ? (
                    <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  )}
                  <span>
                    {statusTargetAdmin.status === 'ACTIVE'
                      ? 'Xaqiijinta Xanibaadda Maamulaha'
                      : 'Xaqiijinta Furitaanka Maamulaha'}
                  </span>
                </div>
              </div>

              {/* Line Row 2: Admin Info resting directly on line 2 */}
              <div className="absolute top-[43.8%] left-[8%] right-[8%] h-[9.4%] flex items-end justify-center pb-0.5">
                <div className="flex items-center space-x-2 sm:space-x-3 text-[10px] sm:text-xs text-slate-800 font-semibold leading-none">
                  <span>
                    Maamule: <strong className="text-slate-950 font-black">{statusTargetAdmin.name}</strong>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-slate-700 font-medium truncate max-w-[120px] sm:max-w-none">
                    {statusTargetAdmin.email}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-bold text-[#142746]">{statusTargetAdmin.platformRole}</span>
                </div>
              </div>

              {/* Line Row 3: Question text resting directly on line 3 */}
              <div className="absolute top-[53.2%] left-[8%] right-[8%] h-[9.4%] flex items-end justify-center pb-0.5">
                <p className="text-[11px] sm:text-xs font-bold text-slate-800 text-center leading-none">
                  {statusTargetAdmin.status === 'ACTIVE'
                    ? 'Ma hubtaa inaad xanibto maamulahan?'
                    : 'Ma hubtaa inaad dib u furto maamulahan?'}
                </p>
              </div>

              {/* Line Row 4: Consequence warning resting directly on line 4 */}
              <div className="absolute top-[62.6%] left-[8%] right-[8%] h-[9.4%] flex items-end justify-center pb-0.5">
                <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium text-center leading-none">
                  {statusTargetAdmin.status === 'ACTIVE'
                    ? 'Ma awoodi doono inuu nidaamka soo galo ilaa dib loo furo.'
                    : 'Wuxuu si toos ah u awoodi doonaa inuu nidaamka galo.'}
                </p>
              </div>

              {/* Line Row 5 & 6: Action buttons resting in the bottom section */}
              <div className="absolute bottom-[8%] right-[8%] flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setStatusModalOpen(false);
                    setStatusTargetAdmin(null);
                  }}
                  className="px-3 sm:px-5 py-1.5 sm:py-2 border border-slate-300 rounded-xl font-bold text-[10px] sm:text-xs text-slate-600 hover:bg-slate-100 transition-colors shadow-xs bg-white/90"
                >
                  Ka Noqo
                </button>
                <button
                  type="button"
                  onClick={handleToggle}
                  disabled={actionLoading}
                  className={`px-4 sm:px-6 py-1.5 sm:py-2 text-white rounded-xl font-bold text-[10px] sm:text-xs transition-all shadow-md disabled:opacity-50 ${
                    statusTargetAdmin.status === 'ACTIVE'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  }`}
                >
                  {actionLoading
                    ? 'Waa la fulinayaa...'
                    : statusTargetAdmin.status === 'ACTIVE'
                    ? 'Haa, Xanib (Deactivate)'
                    : 'Haa, Fur (Activate)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (EXACT AUTHENTIC PAPER CARD WITH BINDER CLIP & X BUTTON) */}
      {deleteModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="relative max-w-xl w-full mx-auto select-none my-auto animate-scaleUp">
            {/* The Authentic Lined Paper Card with Binder Clip Image */}
            <img
              src="/binder-paper-card.png"
              alt="Maraayn Notice Card"
              className="w-full h-auto drop-shadow-2xl select-none block pointer-events-none"
            />

            {/* Seamless Content Overlay calibrated directly onto the paper lines */}
            <div className="absolute inset-0">
              {/* Top Row: Maraayn Branding & 'X' Close Button (Safely inside paper top margin) */}
              <div className="absolute top-[24%] left-[8%] right-[8%] flex items-center justify-between">
                <div className="flex items-center space-x-2 max-w-[180px] sm:max-w-[220px]">
                  <img src="/logo.png" alt="Maraayn" className="h-6 sm:h-7 object-contain shrink-0" />
                  <div className="min-w-0">
                    <div className="font-black text-[11px] sm:text-sm text-[#142746] leading-tight truncate">
                      Maraayn System
                    </div>
                    <div className="text-[8px] sm:text-[9px] text-rose-600 font-extrabold uppercase tracking-wider">
                      Xaqiijinta Tirtirka
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setSelectedAdmin(null);
                  }}
                  className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors z-20 cursor-pointer"
                  title="Ka Noqo (Close)"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Line Row 1: Status Title Badge centered between lines */}
              <div className="absolute top-[33.5%] left-[8%] right-[8%] h-[9.8%] flex items-center justify-center">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full font-extrabold text-[11px] sm:text-xs md:text-sm shadow-xs backdrop-blur-xs border bg-rose-500/15 border-rose-500/30 text-rose-800">
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Xaqiijinta Tirtirka Maamulaha</span>
                </div>
              </div>

              {/* Line Row 2: Admin Info resting directly on line 2 */}
              <div className="absolute top-[43.8%] left-[8%] right-[8%] h-[9.4%] flex items-end justify-center pb-0.5">
                <div className="flex items-center space-x-2 sm:space-x-3 text-[10px] sm:text-xs text-slate-800 font-semibold leading-none">
                  <span>
                    Maamule: <strong className="text-slate-950 font-black">{selectedAdmin.name}</strong>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-slate-700 font-medium truncate max-w-[120px] sm:max-w-none">
                    {selectedAdmin.email}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-bold text-[#142746]">{selectedAdmin.platformRole}</span>
                </div>
              </div>

              {/* Line Row 3: Main Warning text resting directly on line 3 */}
              <div className="absolute top-[53.2%] left-[8%] right-[8%] h-[9.4%] flex items-end justify-center pb-0.5">
                <p className="text-[11px] sm:text-xs font-bold text-rose-700 text-center leading-none">
                  Ma hubtaa inaad gabi ahaanba tirtirto maamulahan?
                </p>
              </div>

              {/* Line Row 4: Consequence warning resting directly on line 4 */}
              <div className="absolute top-[62.6%] left-[8%] right-[8%] h-[9.4%] flex items-end justify-center pb-0.5">
                <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium text-center leading-none">
                  Tallaabadan dib looma noqon karo oo xogta gebi ahaanba waa laga saarayaa.
                </p>
              </div>

              {/* Line Row 5 & 6: Action buttons resting in the bottom section */}
              <div className="absolute bottom-[8%] right-[8%] flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setSelectedAdmin(null);
                  }}
                  className="px-3 sm:px-5 py-1.5 sm:py-2 border border-slate-300 rounded-xl font-bold text-[10px] sm:text-xs text-slate-600 hover:bg-slate-100 transition-colors shadow-xs bg-white/90"
                >
                  Ka Noqo
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="px-4 sm:px-6 py-1.5 sm:py-2 text-white rounded-xl font-bold text-[10px] sm:text-xs bg-rose-600 hover:bg-rose-700 transition-all shadow-md shadow-rose-600/30 disabled:opacity-50"
                >
                  {actionLoading ? 'Waa la tirtirayaa...' : 'Haa, Tirtir (Delete)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
