import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  CreditCard,
} from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';

export const BusinessReportsPage: React.FC = () => {
  const { tenant } = useAuth();
  const [period, setPeriod] = useState('month');
  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'debts' | 'expenses'>('sales');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currency = tenant?.currencySymbol || '$';

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/export', {
        params: {
          type: reportType,
          period,
        },
      });
      setData(res.data || []);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, period]);

  const exportCsv = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).filter((k) => typeof data[0][k] !== 'object');
    const rows = data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? '')).join(','),
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${tenant?.name}_report_${reportType}_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142746] tracking-tight">
            Business Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official financial statements for sales, profits, customer debts, and inventory valuation
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportCsv}
            disabled={data.length === 0}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-brand-navy hover:bg-brand-navy-light rounded-xl text-xs font-bold text-white transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Selection Tabs & Period Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-3 text-xs">
        <div className="flex gap-2">
          {[
            { id: 'sales', label: 'Sales Report', icon: TrendingUp },
            { id: 'inventory', label: 'Inventory Valuation', icon: Package },
            { id: 'debts', label: 'Debt Ledger', icon: CreditCard },
            { id: 'expenses', label: 'Expenses Report', icon: DollarSign },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl font-bold transition-all ${
                reportType === tab.id
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 bg-slate-50 border rounded-xl font-bold text-slate-800 focus:outline-none"
        >
          <option value="today">Today</option>
          <option value="7days">Last 7 Days</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Generating report data, please wait...</div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No data found for the selected period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                  {reportType === 'sales' && (
                    <>
                      <th className="py-3 px-3">Sale Number</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Total</th>
                      <th className="py-3 px-3">Paid</th>
                      <th className="py-3 px-3">Balance Due</th>
                    </>
                  )}
                  {reportType === 'inventory' && (
                    <>
                      <th className="py-3 px-3">Product Name</th>
                      <th className="py-3 px-3">SKU</th>
                      <th className="py-3 px-3">Current Stock</th>
                      <th className="py-3 px-3">Cost Price</th>
                      <th className="py-3 px-3">Selling Price</th>
                      <th className="py-3 px-3">Total Value</th>
                    </>
                  )}
                  {reportType === 'debts' && (
                    <>
                      <th className="py-3 px-3">Debt No</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Total Sale</th>
                      <th className="py-3 px-3">Amount Repaid</th>
                      <th className="py-3 px-3">Remaining Balance</th>
                      <th className="py-3 px-3">Due Date</th>
                    </>
                  )}
                  {reportType === 'expenses' && (
                    <>
                      <th className="py-3 px-3">Expense Title</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Payment Method</th>
                      <th className="py-3 px-3">Amount</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    {reportType === 'sales' && (
                      <>
                        <td className="py-2.5 px-3 font-mono font-bold">{item.saleNumber}</td>
                        <td className="py-2.5 px-3 font-semibold">{item.customerName}</td>
                        <td className="py-2.5 px-3 text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.saleType === 'CREDIT_SALE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {item.saleType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold">{currency}{item.grandTotal}</td>
                        <td className="py-2.5 px-3 text-emerald-600 font-semibold">{currency}{item.amountPaid}</td>
                        <td className="py-2.5 px-3 text-rose-600 font-bold">{item.balanceDue > 0 ? `${currency}${item.balanceDue}` : '-'}</td>
                      </>
                    )}
                    {reportType === 'inventory' && (
                      <>
                        <td className="py-2.5 px-3 font-bold">{item.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{item.sku}</td>
                        <td className="py-2.5 px-3 font-bold">{item.currentQuantity} {item.unit}</td>
                        <td className="py-2.5 px-3 text-slate-600">{currency}{item.purchaseCost}</td>
                        <td className="py-2.5 px-3 text-slate-900 font-bold">{currency}{item.sellingPrice}</td>
                        <td className="py-2.5 px-3 font-extrabold text-brand-navy">
                          {currency}{(item.currentQuantity * item.purchaseCost).toFixed(2)}
                        </td>
                      </>
                    )}
                    {reportType === 'debts' && (
                      <>
                        <td className="py-2.5 px-3 font-mono font-bold">{item.debtNumber}</td>
                        <td className="py-2.5 px-3 font-semibold">{item.customerId?.name || 'Customer'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{new Date(item.saleDate).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3 font-bold">{currency}{item.totalSaleAmount}</td>
                        <td className="py-2.5 px-3 text-emerald-600 font-semibold">{currency}{item.amountRepaid + (item.initialPayment || 0)}</td>
                        <td className="py-2.5 px-3 font-extrabold text-rose-600">{currency}{item.remainingBalance}</td>
                        <td className="py-2.5 px-3 text-slate-500">{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '-'}</td>
                      </>
                    )}
                    {reportType === 'expenses' && (
                      <>
                        <td className="py-2.5 px-3 font-bold">{item.title}</td>
                        <td className="py-2.5 px-3">{item.category}</td>
                        <td className="py-2.5 px-3 text-slate-500">{new Date(item.expenseDate).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3 font-mono">{item.paymentMethod}</td>
                        <td className="py-2.5 px-3 font-extrabold text-rose-600">-{currency}{item.amount}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

