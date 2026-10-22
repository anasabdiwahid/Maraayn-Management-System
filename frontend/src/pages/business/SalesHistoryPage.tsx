import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Receipt,
  Search,
  Filter,
  Plus,
  Printer,
  Eye,
  Calendar,
  Edit2,
  Ban,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { ReceiptModal } from '../../components/common/ReceiptModal.js';
import { formatMoney } from '../../utils/format.js';

export const SalesHistoryPage: React.FC = () => {
  const { tenant } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saleTypeFilter, setSaleTypeFilter] = useState('ALL');

  // Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Edit Sale Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerPhone: '',
    paymentMethod: 'CASH',
    notes: '',
  });

  // Cancel Sale Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingSale, setCancellingSale] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Loading & Alert
  const [actionLoading, setActionLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const currency = tenant?.currencySymbol || '$';

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertInfo({ type, message });
    setTimeout(() => setAlertInfo(null), 4000);
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales', {
        params: {
          search: search || undefined,
          saleType: saleTypeFilter !== 'ALL' ? saleTypeFilter : undefined,
        },
      });
      setSales(res.data.data || []);
    } catch (err) {
      console.error('Failed to load sales history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [saleTypeFilter]);

  const openReceipt = (sale: any) => {
    setSelectedReceipt({
      receiptNumber: sale.receiptNumber,
      receiptType: sale.saleType,
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      items: sale.items,
      grandTotal: sale.grandTotal,
      amountPaid: sale.amountPaid,
      balanceRemaining: sale.balanceDue,
      paymentMethod: sale.paymentMethod,
      notes: sale.notes,
      isCancelled: sale.paymentStatus === 'CANCELLED',
      createdAt: sale.createdAt,
    });
    setReceiptModalOpen(true);
  };

  const handleOpenEdit = (sale: any) => {
    setEditingSale(sale);
    setEditForm({
      customerName: sale.customerName || '',
      customerPhone: sale.customerPhone || '',
      paymentMethod: sale.paymentMethod || 'CASH',
      notes: sale.notes || '',
    });
    setEditModalOpen(true);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    setActionLoading(true);
    try {
      await api.patch(`/sales/${editingSale._id}`, editForm);
      showAlert('success', 'Xogta iibka iyo recite-ka si guul leh ayaa loo cusbooneysiiyay!');
      setEditModalOpen(false);
      setEditingSale(null);
      fetchSales();
    } catch (err: any) {
      showAlert('error', err.response?.data?.message || 'Khalad ayaa dhacay markii iibka la beddelayay');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCancel = (sale: any) => {
    setCancellingSale(sale);
    setCancelReason('Macmiilka ayaa alaabta soo celiyay ama khalad ayaa dhacay');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingSale) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/sales/${cancellingSale._id}/cancel`, {
        reason: cancelReason,
      });
      showAlert('success', res.data.message || 'Iibka iyo recite-ka si guul leh ayaa loo kansalay, badeecadana kaydka ayaa lagu celiyay!');
      setCancelModalOpen(false);
      setCancellingSale(null);
      fetchSales();
    } catch (err: any) {
      showAlert('error', err.response?.data?.message || 'Khalad ayaa dhacay markii iibka la kansalayay');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142746] tracking-tight">
            Sales History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive ledger of all completed sales transactions (Cash & Credit) and receipts. Guji recite kasta si aad u daabacdo, wax uga beddesho, ama u kansasho.
          </p>
        </div>

        <NavLink
          to="/business/sales/new"
          className="flex items-center space-x-2 bg-brand-amber hover:bg-brand-amber-light text-brand-navy font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm self-start"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Sale (POS)</span>
        </NavLink>
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

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchSales();
          }}
          className="flex-1 relative"
        >
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by sale number, receipt number, or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-amber focus:bg-white"
          />
        </form>

        <div className="flex gap-2">
          <select
            value={saleTypeFilter}
            onChange={(e) => setSaleTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Sale Types</option>
            <option value="CASH_SALE">Cash Sales Only</option>
            <option value="CREDIT_SALE">Credit Sales Only</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <th className="py-3.5 px-4">Sale No / Receipt</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Sale Type</th>
                <th className="py-3.5 px-4">Grand Total</th>
                <th className="py-3.5 px-4">Amount Paid</th>
                <th className="py-3.5 px-4">Balance Due</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading sales history, please wait...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No sales records found.
                  </td>
                </tr>
              ) : (
                sales.map((s) => {
                  const isCancelled = s.paymentStatus === 'CANCELLED';
                  return (
                    <tr
                      key={s._id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isCancelled ? 'bg-rose-50/30 opacity-75' : ''
                      }`}
                    >
                      {/* Clickable Sale / Receipt No */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => openReceipt(s)}
                          className="text-left group cursor-pointer focus:outline-none"
                          title="Guji si aad u aragto oo u daabacdo recite-ka"
                        >
                          <span className="font-bold text-slate-900 block font-mono group-hover:text-brand-amber transition-colors flex items-center space-x-1">
                            <span>{s.saleNumber}</span>
                            <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-amber" />
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            RCP: {s.receiptNumber}
                          </span>
                        </button>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {s.customerName}
                        {s.customerPhone && (
                          <span className="text-[10px] text-slate-400 block font-normal font-mono">
                            {s.customerPhone}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(s.createdAt).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isCancelled
                              ? 'bg-rose-100 text-rose-800'
                              : s.saleType === 'CREDIT_SALE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isCancelled ? 'KANSAL / VOID' : s.saleType === 'CREDIT_SALE' ? 'Credit Sale' : 'Cash Sale'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {isCancelled ? (
                          <span className="line-through text-slate-400">{currency}{formatMoney(s.grandTotal)}</span>
                        ) : (
                          <span>{currency}{formatMoney(s.grandTotal)}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-emerald-600 font-semibold whitespace-nowrap">
                        {isCancelled ? (
                          <span className="line-through text-slate-400">{currency}{formatMoney(s.amountPaid)}</span>
                        ) : (
                          <span>{currency}{formatMoney(s.amountPaid)}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {s.balanceDue > 0 && !isCancelled ? (
                          <span className="font-bold text-rose-600">{currency}{formatMoney(s.balanceDue)}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1">
                          {/* 1. View / Print / WhatsApp Receipt */}
                          <button
                            type="button"
                            onClick={() => openReceipt(s)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                            title="Eeg / Dir Recite-ka"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Edit Sale Details */}
                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(s)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition-colors border border-amber-200/60"
                              title="Wax Ka Beddel Xogta (Edit)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 3. Cancel Sale & Void Receipt */}
                          {!isCancelled ? (
                            <button
                              type="button"
                              onClick={() => handleOpenCancel(s)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold transition-colors border border-rose-200/60"
                              title="Kansal Garee Iibka & Recite-ka (Void)"
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

      {/* EDIT SALE MODAL */}
      {editModalOpen && editingSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-brand-navy" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Wax Ka Beddel Iibka / Recite-ka
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
                  Sale Number & Receipt
                </label>
                <div className="p-2.5 bg-slate-50 rounded-xl font-mono text-slate-700 font-semibold border border-slate-200 flex justify-between">
                  <span>{editingSale.saleNumber}</span>
                  <span className="text-slate-400">RCP: {editingSale.receiptNumber}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Magaca Macmiilka (Customer Name)
                </label>
                <input
                  type="text"
                  value={editForm.customerName}
                  onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                  placeholder="Magaca macmiilka"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-amber font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Telefoonka Macmiilka (Phone)
                </label>
                <input
                  type="text"
                  value={editForm.customerPhone}
                  onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                  placeholder="e.g. 061XXXXXXX"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-amber font-mono"
                />
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
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Faahfaahin / Qoraal (Notes)
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

      {/* CANCEL SALE CONFIRMATION MODAL (AUTHENTIC PAPER CARD STYLE) */}
      {cancelModalOpen && cancellingSale && (
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
                      Kansalaad Iib & Recite
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCancelModalOpen(false);
                    setCancellingSale(null);
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
                  <span>Xaqiijinta Kansal-garaynta Iibka</span>
                </div>
              </div>

              {/* Line Row 2: Sale & Receipt details resting on line 2 */}
              <div className="absolute top-[43.8%] left-[8%] right-[8%] h-[9.4%] flex items-end justify-center pb-0.5">
                <div className="flex items-center space-x-2 sm:space-x-3 text-[10px] sm:text-xs text-slate-800 font-semibold leading-none">
                  <span>
                    Iib: <strong className="text-slate-950 font-black">{cancellingSale.saleNumber}</strong>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-slate-700 font-medium">
                    RCP: {cancellingSale.receiptNumber}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-extrabold text-slate-900">
                    {currency}{cancellingSale.grandTotal}
                  </span>
                </div>
              </div>

              {/* Line Row 3: Question resting directly on line 3 */}
              <div className="absolute top-[53.2%] left-[8%] right-[8%] h-[9.4%] flex items-end justify-center pb-0.5">
                <p className="text-[11px] sm:text-xs font-bold text-rose-700 text-center leading-none">
                  Ma hubtaa inaad kansasho iibkan iyo recite-kiisa?
                </p>
              </div>

              {/* Line Row 4: Consequence notice resting directly on line 4 */}
              <div className="absolute top-[62.6%] left-[8%] right-[8%] h-[9.4%] flex items-end justify-center pb-0.5">
                <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium text-center leading-none">
                  Dhammaan alaabooyinka waxaa si toos ah loogu celinayaa kaydka (Stock).
                </p>
              </div>

              {/* Line Row 5 & 6: Action Buttons */}
              <div className="absolute bottom-[8%] right-[8%] flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setCancelModalOpen(false);
                    setCancellingSale(null);
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
