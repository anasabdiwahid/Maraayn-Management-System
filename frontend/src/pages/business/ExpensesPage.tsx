import React, { useEffect, useState } from 'react';
import { TrendingDown, Plus, Search, Calendar, DollarSign, X } from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';

export const ExpensesPage: React.FC = () => {
  const { tenant } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const currency = tenant?.currencySymbol || '$';

  const [formData, setFormData] = useState({
    title: '',
    category: 'Rent',
    amount: 0,
    paymentMethod: 'CASH',
    description: '',
  });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses');
      setExpenses(res.data.data || []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expenses', formData);
      setModalOpen(false);
      setFormData({ title: '', category: 'Rent', amount: 0, paymentMethod: 'CASH', description: '' });
      fetchExpenses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error recording expense');
    }
  };

  const totalExpenseAmount = expenses.reduce((a, b) => a + (b.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142746] tracking-tight">
            Operational Expenses
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Record and track daily operational expenses (Rent, Utilities, Payroll, Supplies) for precise net profit computation
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-2 bg-brand-amber hover:bg-brand-amber-light text-brand-navy font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm self-start"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Expense</span>
        </button>
      </div>

      {/* Summary Box */}
      <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between max-w-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Total Expenses</span>
          <h3 className="text-2xl font-black text-rose-800 mt-1">
            {currency}{totalExpenseAmount}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{expenses.length} recorded expense entries</p>
        </div>
        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
          <TrendingDown className="w-6 h-6" />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
              <th className="py-3.5 px-4">Expense Title</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Payment Method</th>
              <th className="py-3.5 px-4">Amount</th>
              <th className="py-3.5 px-4">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">Loading expenses, please wait...</td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">No expenses recorded yet.</td>
              </tr>
            ) : (
              expenses.map((e) => (
                <tr key={e._id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-bold text-slate-900">{e.title}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-[11px]">
                      {e.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{new Date(e.expenseDate || e.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4 font-mono">{e.paymentMethod}</td>
                  <td className="py-3 px-4 font-extrabold text-rose-600">-{currency}{e.amount}</td>
                  <td className="py-3 px-4 text-slate-500">{e.description || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add New Expense</h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Monthly Store Rent, Electricity Bill..."
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  >
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Salaries">Salaries & Payroll</option>
                    <option value="Supplies">Store Supplies</option>
                    <option value="Maintenance">Maintenance & Repairs</option>
                    <option value="Marketing">Marketing & Ads</option>
                    <option value="Transport">Transport & Logistics</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                >
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Additional Notes / Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional details or reference..."
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="mt-5 flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-navy hover:bg-brand-navy-light text-white rounded-xl font-bold transition-colors"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

