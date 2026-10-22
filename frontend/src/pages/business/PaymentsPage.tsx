import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  Calendar,
  User,
  DollarSign,
  Eye,
  Edit2,
  Ban,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
} from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { ReceiptModal } from '../../components/common/ReceiptModal.js';
import { formatMoney } from '../../utils/format.js';

export const PaymentsPage: React.FC = () => {
  const { tenant } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    paymentMethod: 'CASH',
    reference: '',
    notes: '',
  });

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingPayment, setCancellingPayment] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Loading & Alert state
  const [actionLoading, setActionLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const currency = tenant?.currencySymbol || '$';

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertInfo({ type, message });
    setTimeout(() => setAlertInfo(null), 4000);
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments', {
        params: {
          search: search || undefined,
          method: methodFilter !== 'ALL' ? methodFilter : undefined,
        },
      });
      setPayments(res.data.data || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [methodFilter]);

  // Handle open receipt preview
  const handleOpenReceipt = async (p: any) => {
    try {
      const res = await api.get(`/payments/${p._id}/receipt`);
      setSelectedReceipt(res.data);
      setReceiptModalOpen(true);
    } catch (err) {
      // Fallback: construct receipt from payment record
      setSelectedReceipt({
        receiptNumber: p.receiptNumber || p.paymentNumber,
        customerName: p.customerId?.name || 'Customer',
        customerPhone: p.customerId?.phone || '',
        items: [
          {
            productName: p.reference || 'Payment Transaction',
            quantity: 1,
            unitPrice: p.amount,
            total: p.amount,
          },
        ],
        grandTotal: p.amount,
        amountPaid: p.amount,
        balanceRemaining: 0,
        paymentMethod: p.paymentMethod,
        notes: p.notes,
        isCancelled: p.isCancelled || false,
        createdAt: p.paymentDate || p.createdAt,
      });
      setReceiptModalOpen(true);
    }
  };

  // Handle Open Edit Modal
  const handleOpenEdit = (p: any) => {
    setEditingPayment(p);
    setEditForm({
      paymentMethod: p.paymentMethod || 'CASH',
      reference: p.reference || '',
      notes: p.notes || '',
    });
    setEditModalOpen(true);
  };

  // Submit Edit
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    setActionLoading(true);
    try {
      await api.patch(`/payments/${editingPayment._id}`, editForm);
      showAlert('success', 'Xogta bixinta iyo recite-ka si guul leh ayaa loo cusbooneysiiyay!');
      setEditModalOpen(false);
      setEditingPayment(null);
      fetchPayments();
    } catch (err: any) {
      showAlert('error', err.response?.data?.message || 'Khalad ayaa dhacay markii xogta la beddelayay');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Open Cancel Modal
  const handleOpenCancel = (p: any) => {
    setCancellingPayment(p);
    setCancelReason('Macmiilka ayaa codsaday kansal garayn');
    setCancelModalOpen(true);
  };

  // Submit Cancel
  const handleConfirmCancel = async () => {
    if (!cancellingPayment) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/payments/${cancellingPayment._id}/cancel`, {
        reason: cancelReason,
      });
      showAlert('success', res.data.message || 'Bixinta/Recite-ka si guul leh ayaa loo kansalay!');
      setCancelModalOpen(false);
      setCancellingPayment(null);
      fetchPayments();
    } catch (err: any) {
      showAlert('error', err.response?.data?.message || 'Khalad ayaa dhacay markii la kansalayay');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142746] tracking-tight">
            Payment Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit trail of all received cash, mobile money payments, and debt collections. Guji recite kasta si aad u daabacdo, wax uga beddesho, ama u kansasho.
          </p>
        </div>
      </div>

      {/* Alert Banner */}
      {alertInfo && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-3 text-xs font-semibold animate-fadeIn ${
            alertInfo.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {alertInfo.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{alertInfo.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchPayments();
          }}
          className="flex-1 relative"
        >
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by payment no, receipt no, reference, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-amber focus:bg-white"
          />
        </form>

        <div className="flex gap-2">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="CASH">Cash</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CARD">Card</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <th className="py-3.5 px-4">Payment No / Receipt</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Amount Received</th>
                <th className="py-3.5 px-4">Reference / Notes</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading payments, please wait...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No payment transactions recorded.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isCancelled = p.isCancelled || (p.notes && p.notes.includes('[CANCELLED]'));
                  return (
                    <tr
                      key={p._id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isCancelled ? 'bg-rose-50/30 opacity-75' : ''
                      }`}
                    >
                      {/* Clickable Payment Number / Receipt Number */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(p)}
                          className="text-left group cursor-pointer focus:outline-none"
                          title="Guji si aad u aragto oo u daabacdo recite-ka"
                        >
                          <span className="font-mono font-bold text-brand-navy group-hover:text-brand-amber transition-colors flex items-center space-x-1">
                            <span>{p.paymentNumber}</span>
                            <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-amber" />
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {p.receiptNumber}
                          </span>
                        </button>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {p.customerId?.name || 'Walk-in Customer'}
                        {p.customerId?.phone && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {p.customerId.phone}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(p.paymentDate || p.createdAt).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-[11px] text-slate-700">
                          {p.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-extrabold text-sm whitespace-nowrap">
                        {isCancelled ? (
                          <div className="flex items-center space-x-1 text-rose-500 line-through">
                            <span>+{currency}{formatMoney(p.amount)}</span>
                            <span className="text-[10px] bg-rose-100 px-1.5 py-0.2 rounded font-black no-underline">
                              KANSAL
                            </span>
                          </div>
                        ) : (
                          <span className="text-emerald-600">+{currency}{formatMoney(p.amount)}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {p.reference || p.notes || '-'}
                      </td>

                      {/* Actions Column: Receipt View, Edit, Cancel */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1">
                          {/* 1. View / Print / WhatsApp Receipt */}
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(p)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                            title="Eeg / Dir Recite-ka"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Edit Payment Details */}
                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition-colors border border-amber-200/60"
                              title="Wax Ka Beddel Xogta (Edit)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 3. Cancel / Void Payment */}
                          {!isCancelled ? (
                            <button
                              type="button"
                              onClick={() => handleOpenCancel(p)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold transition-colors border border-rose-200/60"
                              title="Kansal Garee (Void)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-500 bg-rose-100/60 px-2 py-0.5 rounded">
                              Kansalan
                            </span>
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
      </div>

      {/* EDIT PAYMENT MODAL */}
      {editModalOpen && editingPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-brand-navy" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Wax Ka Beddel Bixinta / Recite-ka
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Payment No & Receipt
                </label>
                <div className="p-2.5 bg-slate-50 rounded-xl font-mono text-slate-700 font-semibold border border-slate-200 flex justify-between">
                  <span>{editingPayment.paymentNumber}</span>
                  <span className="text-slate-400">{editingPayment.receiptNumber}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Habka Bixinta (Payment Method)
                </label>
                <select
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-amber"
                >
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_MONEY">Mobile Money (EVC / Zaad / Sahal / Waafi)</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Credit / Debit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Tixraac (Reference / Transaction ID)
                </label>
                <input
                  type="text"
                  value={editForm.reference}
                  onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })}
                  placeholder="e.g. TXN-123456 ama EVC Number"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-amber"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Faahfaahin / Notes
                </label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Qor faahfaahin dheeraad ah..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-amber"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-brand-navy hover:bg-brand-navy-light text-white rounded-xl font-bold transition-all shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Waa la keydinayaa...' : 'Keydi Isbeddelka'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL (AUTHENTIC PAPER CARD STYLE) */}
      {cancelModalOpen && cancellingPayment && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="relative max-w-xl w-full mx-auto select-none my-auto animate-scaleUp">
            {/* The Authentic Lined Paper Card with Binder Clip Image */}
            <img
              src="/binder-paper-card.png"
              alt="Maraayn Notice Card"
              className="w-full h-auto drop-shadow-2xl select-none block pointer-events-none"
            />

            {/* Seamless Content Overlay calibrated directly onto paper lines */}
            <div className="absolute inset-0">
              {/* Top Row: Maraayn Branding & 'X' Close Button */}
              <div className="absolute top-[20%] left-[8%] right-[8%] flex items-center justify-between">
                <div className="flex items-center space-x-1.5 sm:space-x-2 max-w-[170px] sm:max-w-[210px]">
                  <div className="bg-white/95 p-1 rounded-lg border border-slate-200/60 shadow-xs shrink-0">
                    <img src="/logo.png" alt="Maraayn" className="h-5 sm:h-7 object-contain" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-[11px] sm:text-sm text-[#142746] leading-tight truncate">
                      Maraayn System
                    </div>
                    <div className="text-[8px] sm:text-[9px] text-rose-600 font-extrabold uppercase tracking-wider">
                      Ogeysiis Kansalaad
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCancelModalOpen(false);
                    setCancellingPayment(null);
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
                  <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Xaqiijinta Kansal-garaynta Bixinta</span>
                </div>
              </div>

              {/* Line Row 2: Payment & Receipt details resting on line 2 */}
              <div className="absolute top-[43.8%] left-[8%] right-[8%] h-[9.4%] flex items-end justify-center pb-0.5">
                <div className="flex items-center space-x-2 sm:space-x-3 text-[10px] sm:text-xs text-slate-800 font-semibold leading-none">
                  <span>
                    Bixin: <strong className="text-slate-950 font-black">{cancellingPayment.paymentNumber}</strong>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-slate-700 font-medium">
                    {cancellingPayment.receiptNumber}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-extrabold text-emerald-700">
                    +{currency}{cancellingPayment.amount}
                  </span>
                </div>
              </div>

              {/* Line Row 3: Question resting directly on line 3 */}
              <div className="absolute top-[53.2%] left-[8%] right-[8%] h-[9.4%] flex items-end justify-center pb-0.5">
                <p className="text-[11px] sm:text-xs font-bold text-rose-700 text-center leading-none">
                  Ma hubtaa inaad kansasho bixintan iyo recite-keeda?
                </p>
              </div>

              {/* Line Row 4: Consequence notice resting directly on line 4 */}
              <div className="absolute top-[62.6%] left-[8%] right-[8%] h-[9.4%] flex items-end justify-center pb-0.5">
                <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium text-center leading-none">
                  Lacagta waxaa dib loogu celinayaa xisaabta iibka ama daynta macmiilka.
                </p>
              </div>

              {/* Line Row 5 & 6: Action Buttons */}
              <div className="absolute bottom-[8%] right-[8%] flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setCancelModalOpen(false);
                    setCancellingPayment(null);
                  }}
                  className="px-3 sm:px-5 py-1.5 sm:py-2 border border-slate-300 rounded-xl font-bold text-[10px] sm:text-xs text-slate-600 hover:bg-slate-100 transition-colors shadow-xs bg-white/90"
                >
                  Ka Noqo
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={actionLoading}
                  className="px-4 sm:px-6 py-1.5 sm:py-2 text-white rounded-xl font-bold text-[10px] sm:text-xs bg-rose-600 hover:bg-rose-700 transition-all shadow-md shadow-rose-600/30 disabled:opacity-50"
                >
                  {actionLoading ? 'Waa la kansalayaa...' : 'Haa, Kansal Garee (Void)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={receiptModalOpen}
          onClose={() => setReceiptModalOpen(false)}
          receiptData={selectedReceipt}
        />
      )}
    </div>
  );
};
