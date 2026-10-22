import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  CreditCard,
  X,
  FileText,
} from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Customer } from '../../types/index.js';
import { createCustomerStatementImage } from '../../utils/customerStatement.js';

export const CustomersPage: React.FC = () => {
  const { tenant } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hasDebtFilter, setHasDebtFilter] = useState(false);

  // Add Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    openingBalance: 0,
    notes: '',
  });

  // Customer Detail Drawer
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [repaymentDebtId, setRepaymentDebtId] = useState<string | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [repaymentMethod, setRepaymentMethod] = useState('CASH');
  const [repaymentError, setRepaymentError] = useState('');
  const [repaymentSubmitting, setRepaymentSubmitting] = useState(false);
  const [sharingStatementId, setSharingStatementId] = useState<string | null>(null);

  const currency = tenant?.currencySymbol || '$';

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', {
        params: {
          search: search || undefined,
          hasDebt: hasDebtFilter ? true : undefined,
        },
      });
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [hasDebtFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customers', formData);
      setAddModalOpen(false);
      setFormData({ name: '', phone: '', email: '', address: '', openingBalance: 0, notes: '' });
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error adding customer');
    }
  };

  const openCustomerDetail = async (c: Customer) => {
    setSelectedCustomer(c);
    setDetailLoading(true);
    try {
      const res = await api.get(`/customers/${c._id}`);
      setDetailData(res.data);
    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDebtRepayment = async (e: React.FormEvent, debt: any) => {
    e.preventDefault();
    const amount = Number(repaymentAmount);
    if (!amount || amount <= 0) {
      setRepaymentError('Geli lacag ka weyn eber.');
      return;
    }
    if (amount > debt.remainingBalance) {
      setRepaymentError(`Lacagtu kama badnaan karto daynta hartay (${currency}${debt.remainingBalance}).`);
      return;
    }

    setRepaymentSubmitting(true);
    setRepaymentError('');
    try {
      await api.post(`/debts/${debt._id}/repay`, { amount, paymentMethod: repaymentMethod });
      const res = await api.get(`/customers/${selectedCustomer._id}`);
      setDetailData(res.data);
      setSelectedCustomer(res.data.customer);
      setRepaymentDebtId(null);
      setRepaymentAmount('');
      await fetchCustomers();
    } catch (err: any) {
      setRepaymentError(err.response?.data?.message || 'Lacag-bixinta daynta lama diiwaangelin.');
    } finally {
      setRepaymentSubmitting(false);
    }
  };

  const handleWhatsAppStatement = async (customer: Customer) => {
    setSharingStatementId(customer._id);
    try {
      const response = await api.get(`/customers/${customer._id}`);
      const account = response.data.customer || customer;
      const payments = (response.data.payments || []).filter((payment: any) => !payment.isCancelled);
      const file = await createCustomerStatementImage(
        account,
        response.data.debts || [],
        payments,
        tenant?.name || 'Maraayn',
        currency,
      );
      let phone = (account.phone || customer.phone || '').replace(/[^0-9]/g, '');
      if (phone.startsWith('0')) phone = `252${phone.substring(1)}`;
      else if (phone.length === 9) phone = `252${phone}`;

      if (navigator.canShare?.({ files: [file] }) && typeof navigator.share === 'function') {
        try {
          await navigator.share({ files: [file] });
          return;
        } catch (shareError: any) {
          if (shareError.name === 'AbortError') return;
          console.warn('File sharing is unavailable; downloading the PDF instead.', shareError);
        }
      }

      const url = URL.createObjectURL(file);
      const download = document.createElement('a');
      download.href = url;
      download.download = file.name;
      download.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      const whatsappWindow = window.open(phone ? `https://wa.me/${phone}` : 'https://wa.me/', '_blank', 'noopener,noreferrer');
      window.alert(
        whatsappWindow
          ? 'Sawirka rasiidka PNG-ga Af-Soomaaliga ah waa la soo dejiyey, WhatsApp-na waa la furay. Fadlan PNG-ga ku lifaaq wada sheekaysiga macmiilka.'
          : 'Sawirka rasiidka PNG-ga Af-Soomaaliga ah waa la soo dejiyey. Fadlan fur WhatsApp oo sawirka ku lifaaq wada sheekaysiga macmiilka.',
      );
    } catch (err) {
      console.error('Failed to create customer statement:', err);
      window.alert('Rasiidka lama diyaarin. Fadlan mar kale isku day.');
    } finally {
      setSharingStatementId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142746] tracking-tight">
            Customer Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Customer records, purchase history, and debt accounts
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center space-x-2 bg-brand-amber hover:bg-brand-amber-light text-brand-navy font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm self-start"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search & Debt Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-amber focus:bg-white"
          />
        </form>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setHasDebtFilter(!hasDebtFilter)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1.5 ${
              hasDebtFilter
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Customers with Debt Only</span>
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <th className="py-3.5 px-4">Customer / Code</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Total Purchases</th>
                <th className="py-3.5 px-4">Total Paid</th>
                <th className="py-3.5 px-4">Outstanding Debt</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading customers, please wait...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No customers found matching the criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{c.code}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {currency}{c.totalPurchases || 0}
                    </td>

                    <td className="py-3 px-4 text-emerald-600 font-semibold">
                      {currency}{c.totalPaid || 0}
                    </td>

                    <td className="py-3 px-4">
                      {c.currentDebtBalance > 0 ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-rose-700 bg-rose-50 border border-rose-200">
                          {currency}{c.currentDebtBalance}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium text-[11px]">No Debt</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* WhatsApp Statement Share */}
                      <button
                        type="button"
                        onClick={() => handleWhatsAppStatement(c)}
                        disabled={sharingStatementId === c._id}
                        title="U dir sawirka rasiidka WhatsApp"
                        className="inline-flex p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => openCustomerDetail(c)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add New Customer</h3>
              <button onClick={() => setAddModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mohamed Ali"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number (WhatsApp) *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+123456789..."
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="customer@gmail.com"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address / Location</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Main Street, Suite 4..."
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Opening Debt Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.openingBalance}
                  onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                />
              </div>

              <div className="mt-5 flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-navy hover:bg-brand-navy-light text-white rounded-xl font-bold transition-colors"
                >
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Profile Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-lg h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedCustomer.code} â€¢ {selectedCustomer.phone}</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Debt & Purchase Summary */}
              <div className="grid grid-cols-2 gap-3 my-5">
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
                  <span className="text-[11px] font-bold text-rose-700 uppercase">Daynta Hadhay</span>
                  <p className="text-xl font-extrabold text-rose-800 mt-1">{currency}{selectedCustomer.currentDebtBalance}</p>
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase">Lacagta La Bixiyay</span>
                  <p className="text-xl font-extrabold text-emerald-800 mt-1">{currency}{selectedCustomer.totalPaid || 0}</p>
                </div>
              </div>

              {/* Customer Active Debts List */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b pb-1">
                  Diiwaanka Daynta Macmiilka
                </h4>

                {detailLoading ? (
                  <p className="text-xs text-slate-400 py-4 text-center">Loading debt records...</p>
                ) : detailData?.debts && detailData.debts.length > 0 ? (
                  <div className="space-y-2.5">
                    {detailData.debts.map((d: any) => (
                      (() => {
                        const isCancelled = d.status === 'CANCELLED' || d.notes?.includes('[CANCELLED:');
                        const canRepay = d.remainingBalance > 0 && d.status !== 'PAID' && !isCancelled;
                        return (
                      <div key={d._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>{d.debtNumber}</span>
                          <span className={canRepay ? 'text-rose-600' : 'text-emerald-700'}>
                            {isCancelled ? 'La kansalay' : canRepay ? `${currency}${d.remainingBalance} ayaa dhiman` : 'Waa la bixiyay'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                          <span>Wadarta iibka: {currency}{d.totalSaleAmount}</span>
                          <span>La bixiyay: {currency}{(d.initialPayment || 0) + (d.amountRepaid || 0)}</span>
                        </div>
                        {canRepay && (
                          <div className="mt-3">
                            {repaymentDebtId === d._id ? (
                              <form onSubmit={(e) => handleDebtRepayment(e, d)} className="space-y-2">
                                <label className="block font-semibold text-slate-700">Lacagta uu soo celiyay</label>
                                <div className="grid grid-cols-[1fr_1fr] gap-2">
                                  <input
                                    type="number"
                                    min="0.01"
                                    max={d.remainingBalance}
                                    step="0.01"
                                    required
                                    autoFocus
                                    value={repaymentAmount}
                                    onChange={(e) => setRepaymentAmount(e.target.value)}
                                    placeholder={`Ugu badnaan ${currency}${d.remainingBalance}`}
                                    className="min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-semibold"
                                  />
                                  <select
                                    value={repaymentMethod}
                                    onChange={(e) => setRepaymentMethod(e.target.value)}
                                    className="min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-2"
                                  >
                                    <option value="CASH">Caddaan</option>
                                    <option value="MOBILE_MONEY">Mobile Money</option>
                                    <option value="BANK_TRANSFER">Bangiga</option>
                                    <option value="OTHER">Kale</option>
                                  </select>
                                </div>
                                {repaymentError && <p className="text-rose-600">{repaymentError}</p>}
                                <div className="flex gap-2">
                                  <button
                                    type="submit"
                                    disabled={repaymentSubmitting}
                                    className="rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white disabled:opacity-50"
                                  >
                                    {repaymentSubmitting ? 'Waa la kaydinayaa...' : 'Diiwaangeli lacagta'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setRepaymentDebtId(null); setRepaymentError(''); }}
                                    className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-600"
                                  >
                                    Ka noqo
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setRepaymentDebtId(d._id);
                                  setRepaymentAmount('');
                                  setRepaymentError('');
                                }}
                                className="rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white hover:bg-emerald-700"
                              >
                                + Diiwaangeli lacag soo celis
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                        );
                      })()
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">No debt records on file for this customer</p>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => handleWhatsAppStatement(selectedCustomer)}
                disabled={sharingStatementId === selectedCustomer._id}
                className="flex-1 flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>{sharingStatementId === selectedCustomer._id ? 'Sawirka waa la diyaarinayaa...' : 'U dir sawirka rasiidka WhatsApp'}</span>
              </button>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2.5 border rounded-xl text-xs font-semibold hover:bg-slate-50"
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

