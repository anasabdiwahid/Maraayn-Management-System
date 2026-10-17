import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Receipt, Search, Filter, Plus, Printer, Eye, Calendar } from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { ReceiptModal } from '../../components/common/ReceiptModal.js';

export const SalesHistoryPage: React.FC = () => {
  const { tenant } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saleTypeFilter, setSaleTypeFilter] = useState('ALL');

  // Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const currency = tenant?.currencySymbol || '$';

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
      createdAt: sale.createdAt,
    });
    setReceiptModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142746] tracking-tight">
            Sales History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive ledger of all completed sales transactions (Cash & Credit) and receipts
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
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
                sales.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block font-mono">{s.saleNumber}</span>
                      <span className="text-[10px] text-slate-400 font-mono">RCP: {s.receiptNumber}</span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {s.customerName}
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.saleType === 'CREDIT_SALE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {s.saleType === 'CREDIT_SALE' ? 'Credit Sale' : 'Cash Sale'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      {currency}{s.grandTotal}
                    </td>

                    <td className="py-3 px-4 text-emerald-600 font-semibold">
                      {currency}{s.amountPaid}
                    </td>

                    <td className="py-3 px-4">
                      {s.balanceDue > 0 ? (
                        <span className="font-bold text-rose-600">{currency}{s.balanceDue}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openReceipt(s)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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

