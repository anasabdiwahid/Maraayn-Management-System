import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Package,
  TrendingUp,
  CreditCard,
  Users,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Receipt,
  CheckCircle,
  Clock,
  TrendingDown,
  Minus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { StatCard } from '../../components/common/StatCard.js';
import { formatMoney } from '../../utils/format.js';

export const BusinessDashboardPage: React.FC = () => {
  const { tenant } = useAuth();
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currency = tenant?.currencySymbol || '$';

  const fetchDashboard = async (selectedPeriod: string) => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard', {
        params: { period: selectedPeriod },
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load business dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(period);
  }, [period]);

  const stats = data?.stats;
  const charts = data?.charts;
  const recent = data?.recent;

  const COLORS = ['#142746', '#E6AE43', '#16A34A', '#3B82F6', '#8B5CF6'];

  return (
    <div className="space-y-8">
      {/* Top Banner & Period Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142746] tracking-tight">
            {tenant?.name || 'Maraayn Business'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Guudmarka iibka, lacagaha soo galay, kharashyada, faa'iidada iyo kaydka
          </p>
        </div>

        {/* Period Selector & Quick New Sale Button */}
        <div className="flex items-center space-x-2">
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex text-xs font-semibold text-slate-600">
            {['today', '7days', 'month', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg transition-colors capitalize ${
                  period === p ? 'bg-brand-navy text-white font-bold' : 'hover:text-slate-900'
                }`}
              >
                {p === 'today' ? 'Maanta' : p === '7days' ? '7 maalmood' : p === 'month' ? 'Bishan' : 'Sannadkan'}
              </button>
            ))}
          </div>

          <NavLink
            to="/business/sales/new"
            className="flex items-center space-x-1.5 bg-brand-amber hover:bg-brand-amber-light text-brand-navy font-bold py-2 px-3.5 rounded-xl text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Iib Cusub</span>
          </NavLink>
        </div>
      </div>

      {/* Financial and inventory overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Iibka Guud"
          value={`${currency}${formatMoney(stats?.totalRevenue)}`}
          subtitle={`${stats?.totalSalesCount || 0} iib`}
          icon={TrendingUp}
          color="green"
        />

        <StatCard
          title="Faa'iido Saafi ah"
          value={`${currency}${formatMoney(stats?.netProfit)}`}
          subtitle={`Faa'iido guud oo la xaqiijiyay: ${currency}${formatMoney(stats?.grossProfit)}`}
          icon={DollarSign}
          color="amber"
        />

        <StatCard
          title="Lacag La Helay"
          value={`${currency}${formatMoney(stats?.totalCollected)}`}
          subtitle="Lacagta la qabtay muddadan"
          icon={Receipt}
          color="blue"
        />

        <StatCard
          title="Kharashyada"
          value={`${currency}${formatMoney(stats?.totalExpenses)}`}
          subtitle={`Muddadan: ${period === 'today' ? 'maanta' : period === '7days' ? '7 maalmood' : period === 'month' ? 'bishan' : 'sannadkan'}`}
          icon={TrendingDown}
          color="red"
        />

        <StatCard
          title="Qiimaha Alaabta La Iibiyay"
          value={`${currency}${formatMoney(stats?.costOfGoodsSold)}`}
          subtitle={`${stats?.totalItemsSold || 0} xabo ayaa la iibiyay`}
          icon={ShoppingCart}
          color="navy"
        />

        <StatCard
          title="Daynta Maqan"
          value={`${currency}${formatMoney(stats?.totalOutstandingDebt)}`}
          subtitle={`${stats?.overdueCount || 0} dib u dhacay`}
          icon={CreditCard}
          color="red"
        />

        <StatCard
          title="Dayn La Bixiyay"
          value={`${currency}${formatMoney(stats?.totalDebtRepaid)}`}
          subtitle="Lacagta daynta laga soo celiyay ilaa hadda"
          icon={CheckCircle}
          color="green"
        />

        <StatCard
          title="Faa'iidada Daynta La Soo Celiyay"
          value={`${currency}${formatMoney(stats?.debtRepaymentProfit)}`}
          subtitle="Faa'iidada lacagaha daynta ee muddadan"
          icon={TrendingUp}
          color="amber"
        />

        <StatCard
          title="Qiimaha Kaydka"
          value={`${currency}${formatMoney(stats?.totalInventoryValue)}`}
          subtitle={`${stats?.totalProducts || 0} badeeco • ${stats?.totalStockQuantity || 0} xabo kaydka yaal`}
          icon={Package}
          color="navy"
        />

        <StatCard
          title="Macmiil"
          value={stats?.totalCustomers || 0}
          subtitle="Diiwaangashan"
          icon={Users}
          color="blue"
        />
      </div>

      {/* Profit & Loss Classification (User Request: Alaabta Faa'iidada, Isla Qiimahooda, iyo Qasaarada) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-extrabold text-[#142746] flex items-center gap-2">
              <span>Falanqaynta Iibka iyo Faa'iidada</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Faa'iidada ama khasaaraha alaabta la iibiyay, iyadoo lagu xisaabiyay qiimaha soo gadashada
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            Waqtiga: {period === 'today' ? 'Maanta' : period === '7days' ? '7-dii Maalmood ee u dambeeyay' : period === 'month' ? 'Bishan' : 'Sannadkan'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Alaabta Faa'iidada laga helay */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 rounded-xl border border-emerald-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Alaabta Faa'iido Keentay
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <TrendingUp className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 tracking-tight">
              +{currency}{formatMoney(stats?.profitClassification?.profitable?.totalProfit)}
            </div>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-emerald-200/60 text-xs">
              <span className="text-emerald-800 font-medium">
                Alaab la iibiyay: <strong className="font-bold text-emerald-950">{stats?.profitClassification?.profitable?.itemsCount || 0} xabo</strong>
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                {stats?.profitClassification?.profitable?.salesCount || 0} Iib
              </span>
            </div>
          </div>

          {/* 2. Alaabta Isla Qiimahooda lagu iibiyay (Breakeven) */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50/70 to-sky-100/30 rounded-xl border border-blue-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Faa'iido iyo Khasaare La'aan
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Minus className="w-4 h-4 stroke-[3]" />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-800 tracking-tight">
              {currency}{formatMoney(stats?.profitClassification?.breakeven?.totalRevenue)}
            </div>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-blue-200/60 text-xs">
              <span className="text-blue-800 font-medium">
                Alaab la iibiyay: <strong className="font-bold text-blue-950">{stats?.profitClassification?.breakeven?.itemsCount || 0} xabo</strong>
              </span>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                Faa'iido $0
              </span>
            </div>
          </div>

          {/* 3. Alaabta Qasaarada laga helay (Loss) */}
          <div className="relative overflow-hidden bg-gradient-to-br from-rose-50/70 to-red-100/30 rounded-xl border border-rose-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Alaabta Khasaaraha Keentay
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-sm">
                <TrendingDown className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-700 tracking-tight">
              -{currency}{formatMoney(stats?.profitClassification?.loss?.totalLoss)}
            </div>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-rose-200/60 text-xs">
              <span className="text-rose-800 font-medium">
                Alaab la iibiyay: <strong className="font-bold text-rose-950">{stats?.profitClassification?.loss?.itemsCount || 0} xabo</strong>
              </span>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                {stats?.profitClassification?.loss?.salesCount || 0} Iib
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        {/* Sales & Revenue Trend (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Iibka iyo Kharashyada</h3>
              <p className="text-xs text-slate-400">Isbarbardhigga maalinlaha ah ee muddadan</p>
            </div>
            <TrendingUp className="w-4 h-4 text-brand-amber" />
          </div>

          <div className="h-64 w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.salesTrend || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(value: any) => [`${currency}${formatMoney(value)}`, '']}
                  contentStyle={{ backgroundColor: '#142746', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#16A34A" strokeWidth={2.5} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#DC2626" strokeWidth={2} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Payment Method (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between min-w-0 overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">Hababka Lacag Bixinta</h3>
              <CreditCard className="w-4 h-4 text-brand-navy" />
            </div>
            <p className="text-xs text-slate-400 mb-4">Lacagta dhab ahaan la qabtay muddadan</p>

            <div className="h-44 w-full min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts?.salesByPaymentMethod || []}
                    dataKey="amount"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={5}
                  >
                    {charts?.salesByPaymentMethod?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${currency}${formatMoney(val)}`, '']}
                    contentStyle={{ backgroundColor: '#142746', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {charts?.salesByPaymentMethod?.map((p: any, idx: number) => (
              <div key={idx} className="py-1.5 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-medium text-slate-700">{p.method}</span>
                </div>
                <span className="font-bold text-slate-900">{currency}{formatMoney(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Lists: Recent Sales & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Iibkii Ugu Dambeeyay</h3>
            <NavLink to="/business/sales" className="text-xs font-semibold text-brand-navy hover:underline flex items-center">
              <span>Arag dhammaan</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </NavLink>
          </div>

          <div className="divide-y divide-slate-100">
            {recent?.recentSales && recent.recentSales.length > 0 ? (
              recent.recentSales.map((s: any) => (
                <div key={s._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{s.customerName}</span>
                    <div className="text-[10px] text-slate-400 space-x-1.5">
                      <span>{s.saleNumber}</span>
                      <span>•</span>
                      <span>{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">{currency}{formatMoney(s.grandTotal)}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        s.saleType === 'CREDIT_SALE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {s.saleType === 'CREDIT_SALE' ? 'Credit' : 'Cash'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">No recent sales recorded</div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-800">Kaydka Alaabta Oo Yar</h3>
            </div>
            <NavLink to="/business/products" className="text-xs font-semibold text-brand-navy hover:underline flex items-center">
              <span>Products</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </NavLink>
          </div>

          <div className="divide-y divide-slate-100">
            {recent?.lowStockProducts && recent.lowStockProducts.length > 0 ? (
              recent.lowStockProducts.map((p: any) => (
                <div key={p._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-rose-600 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-xs">
                      Remaining: {p.currentQuantity} {p.unit}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Threshold: {p.minStockAlert}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-emerald-600 flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>All products have sufficient stock!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

