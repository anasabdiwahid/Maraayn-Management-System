import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  Receipt,
  Clock,
  History,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Debt } from '../../types/index.js';
import { ReceiptModal } from '../../components/common/ReceiptModal.js';
import { formatMoney } from '../../utils/format.js';

export const DebtsPage: React.FC = () => {
  const { tenant } = useAuth();
  const [debts, setDebts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Payment Modal
  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);

  const currency = tenant?.currencySymbol || '$';

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/debts', {
        params: {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          search: search || undefined,
        },
      });
      setDebts(res.data.data || []);

      const sumRes = await api.get('/debts/summary');
      setSummary(sumRes.data);
    } catch (err) {
      console.error('Failed to load debts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDebts();
  };

  const openRepayModal = (debt: any) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.remainingBalance); // Default to full remaining balance
    setPaymentReference('');
    setPaymentNotes('');
    setRepayModalOpen(true);
  };

  const openDebtSaleReceipt = (debt: any) => {
    const sale = typeof debt.saleId === 'object' && debt.saleId ? debt.saleId : {};
    const customer = typeof debt.customerId === 'object' && debt.customerId ? debt.customerId : {};
    setGeneratedReceipt({
      receiptNumber: sale.receiptNumber || debt.debtNumber,
      receiptType: sale.saleType || 'CREDIT_SALE',
      customerName: sale.customerName || customer.name || 'Macmiil',
      customerPhone: sale.customerPhone || customer.phone,
      items: sale.items || [],
      grandTotal: sale.grandTotal ?? debt.totalSaleAmount,
      amountPaid: Number(debt.initialPayment || 0) + Number(debt.amountRepaid || 0),
      balanceRemaining: debt.remainingBalance,
      paymentMethod: sale.paymentMethod || 'CASH',
      notes: sale.notes || debt.notes,
      createdAt: sale.createdAt || debt.saleDate,
    });
    setReceiptModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;

    if (paymentAmount <= 0) {
      alert('Fadlan geli lacag sax ah oo ka weyn 0');
      return;
    }

    if (paymentAmount > selectedDebt.remainingBalance) {
      alert(`Lacagta aad gelineyso (${currency}${paymentAmount}) kama badnaan karto daynta dhiman (${currency}${selectedDebt.remainingBalance})`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/debts/${selectedDebt._id}/repay`, {
        amount: Number(paymentAmount),
        paymentMethod,
        reference: paymentReference,
        notes: paymentNotes,
      });

      // Confetti if debt completely settled
      if (res.data.debt.remainingBalance <= 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      setRepayModalOpen(false);

      // Open Payment Receipt
      setGeneratedReceipt({
        receiptNumber: res.data.receipt?.receiptNumber || 'RCP-PMT',
        receiptType: 'DEBT_PAYMENT',
        customerName: selectedDebt.customerId?.name || 'Customer',
        customerPhone: selectedDebt.customerId?.phone,
        items: [
          {
            productName: `Debt Repayment (${selectedDebt.debtNumber})`,
            quantity: 1,
            unitPrice: paymentAmount,
            total: paymentAmount,
          },
        ],
        grandTotal: paymentAmount,
        amountPaid: paymentAmount,
        balanceRemaining: res.data.debt.remainingBalance,
        paymentMethod,
        notes: paymentNotes,
        createdAt: new Date().toISOString(),
      });
      setReceiptModalOpen(true);

      fetchDebts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error recording payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142746] tracking-tight">
            Debt Management & Collections
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor customer credit sales, log full or partial repayments, and send WhatsApp payment reminders
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Total Outstanding Debt</span>
            <h3 className="text-2xl font-black text-rose-800 mt-1">
              {currency}{summary?.totalOutstanding || 0}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{summary?.unpaidCount || 0} open debt accounts</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Total Debt Collected</span>
            <h3 className="text-2xl font-black text-emerald-800 mt-1">
              {currency}{summary?.totalRepaid || 0}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Cumulative repayments collected</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Overdue Accounts</span>
            <h3 className="text-2xl font-black text-amber-800 mt-1">
              {summary?.overdueCount || 0}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Accounts past their scheduled due date</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto text-xs font-bold pb-1">
          {[
            { label: 'All', val: 'ALL' },
            { label: 'Unpaid', val: 'UNPAID' },
            { label: 'Partially Paid', val: 'PARTIALLY_PAID' },
            { label: 'Paid', val: 'PAID' },
            { label: 'Overdue', val: 'OVERDUE' },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setStatusFilter(tab.val)}
              className={`px-3 py-2 rounded-xl transition-colors whitespace-nowrap ${
                statusFilter === tab.val
                  ? 'bg-brand-navy text-white font-extrabold shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Debts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Debt No / Sale</th>
                <th className="py-3.5 px-4">Total Sale</th>
                <th className="py-3.5 px-4">Amount Repaid</th>
                <th className="py-3.5 px-4">Remaining Balance</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading debt records, please wait...
                  </td>
                </tr>
              ) : debts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No debt records found in this category.
                  </td>
                </tr>
              ) : (
                debts.map((d) => {
                  const isPaid = d.status === 'PAID';
                  const isOverdue = d.status === 'OVERDUE';

                  return (
                    <tr key={d._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{d.customerId?.name || 'Customer'}</span>
                        <span className="text-[10px] text-slate-400">{d.customerId?.phone}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-brand-navy block">{d.debtNumber}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{d.saleId?.saleNumber}</span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-800">
                        {currency}{formatMoney(d.totalSaleAmount)}
                      </td>

                      <td className="py-3 px-4 text-emerald-600 font-semibold">
                        {currency}{formatMoney(d.amountRepaid + (d.initialPayment || 0))}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block font-extrabold text-xs px-2.5 py-0.5 rounded-full ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {currency}{formatMoney(d.remainingBalance)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {d.dueDate ? new Date(d.dueDate).toLocaleDateString() : 'No Due Date'}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Open the original sale receipt to share it as an image */}
                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => openDebtSaleReceipt(d)}
                            title="Fur rasiidka iibka daynta si WhatsApp sawir ahaan loogu diro"
                            aria-label="Fur rasiidka iibka daynta"
                            className="inline-flex p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* View History */}
                        <button
                          onClick={() => {
                            setSelectedDebt(d);
                            setHistoryModalOpen(true);
                          }}
                          title="Payment History"
                          className="p-1.5 border rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        {/* Record Payment Button */}
                        {!isPaid && (
                          <button
                            onClick={() => openRepayModal(d)}
                            className="px-3 py-1 bg-brand-amber hover:bg-brand-amber-light text-brand-navy font-bold rounded-lg text-xs shadow-sm transition-colors"
                          >
                            Record Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {repayModalOpen && selectedDebt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Record Debt Repayment
              </h3>
              <button onClick={() => setRepayModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Customer:</span>
                  <span className="font-bold text-slate-800">{selectedDebt.customerId?.name}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Current Balance Due:</span>
                  <span className="font-extrabold text-rose-600 text-sm">{currency}{formatMoney(selectedDebt.remainingBalance)}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Payment Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">{currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max={selectedDebt.remainingBalance}
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border rounded-xl font-extrabold text-base text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-amber"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(selectedDebt.remainingBalance)}
                    className="text-brand-navy font-bold hover:underline"
                  >
                    Pay Full ({currency}{formatMoney(selectedDebt.remainingBalance)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(Number((selectedDebt.remainingBalance / 2).toFixed(2)))}
                    className="text-brand-navy font-bold hover:underline"
                  >
                    Pay Half ({currency}{formatMoney(selectedDebt.remainingBalance / 2)})
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-semibold text-slate-800"
                >
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_MONEY">Mobile Money (EVC / Zaad / Sahal / M-Pesa)</option>
                  <option value="BANK_TRANSFER">Bank Transfer / Remittance</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reference / Note (Optional)</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g., Transaction ID, check number..."
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="mt-5 flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setRepayModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-brand-amber hover:bg-brand-amber-light text-brand-navy rounded-xl font-extrabold transition-all shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Confirm Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {historyModalOpen && selectedDebt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Payment History ({selectedDebt.debtNumber})
              </h3>
              <button onClick={() => setHistoryModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Sale:</span>
                  <span className="font-bold">{currency}{formatMoney(selectedDebt.totalSaleAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Total Repaid:</span>
                  <span>{currency}{formatMoney(selectedDebt.amountRepaid + selectedDebt.initialPayment)}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>Remaining Balance:</span>
                  <span>{currency}{formatMoney(selectedDebt.remainingBalance)}</span>
                </div>
              </div>

              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] pt-2">
                Previous Repayment Transactions
              </h4>

              {selectedDebt.transactionHistory && selectedDebt.transactionHistory.length > 0 ? (
                <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
                  {selectedDebt.transactionHistory.map((h: any, i: number) => (
                    <div key={i} className="p-3 bg-white flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-emerald-600 block">+{currency}{formatMoney(h.amount)}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(h.date).toLocaleDateString()} • {h.method}
                        </span>
                      </div>
                      <span className="text-slate-500 font-mono text-[11px]">
                        Balance: {currency}{formatMoney(h.balanceAfter)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-slate-400 text-xs">
                  No repayments have been recorded for this debt yet.
                </p>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Receipt Modal */}
      {generatedReceipt && (
        <ReceiptModal
          isOpen={receiptModalOpen}
          onClose={() => setReceiptModalOpen(false)}
          receiptData={generatedReceipt}
        />
      )}
    </div>
  );
};

