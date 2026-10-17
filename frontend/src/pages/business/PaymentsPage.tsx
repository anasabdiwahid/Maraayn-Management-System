import React, { useEffect, useState } from 'react';
import { CreditCard, Search, Calendar, User, DollarSign } from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';

export const PaymentsPage: React.FC = () => {
  const { tenant } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const currency = tenant?.currencySymbol || '$';

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments', {
        params: { search: search || undefined },
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
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#142746] tracking-tight">
          Payment Ledger
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Audit trail of all received cash, mobile money payments, and debt collections
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
              <th className="py-3.5 px-4">Payment No / Receipt</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Date & Time</th>
              <th className="py-3.5 px-4">Payment Method</th>
              <th className="py-3.5 px-4">Amount Received</th>
              <th className="py-3.5 px-4">Reference / Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  Loading payments, please wait...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No payment transactions recorded.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-brand-navy">
                    {p.paymentNumber}
                    <span className="text-[10px] text-slate-400 block">{p.receiptNumber}</span>
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {p.customerId?.name || 'Customer'}
                  </td>

                  <td className="py-3 px-4 text-slate-500">
                    {new Date(p.paymentDate || p.createdAt).toLocaleString()}
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-[11px]">
                      {p.paymentMethod}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-extrabold text-emerald-600 text-sm">
                    +{currency}{p.amount}
                  </td>

                  <td className="py-3 px-4 text-slate-500">
                    {p.reference || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

