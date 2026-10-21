import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Receipt,
  CreditCard,
  TrendingDown,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { StorageMeter } from '../common/StorageMeter.js';
import { NotificationsDropdown } from '../common/NotificationsDropdown.js';

export const BusinessLayout: React.FC = () => {
  const { user, tenant, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSuspended = tenant?.status === 'SUSPENDED';

  const navItems = [
    { name: 'Dashboard', path: '/business', icon: LayoutDashboard },
    { name: 'Products & Inventory', path: '/business/products', icon: Package },
    { name: 'Customers', path: '/business/customers', icon: Users },
    { name: 'New Sale (POS)', path: '/business/sales/new', icon: ShoppingCart },
    { name: 'Sales History', path: '/business/sales', icon: Receipt },
    { name: 'Debt Management', path: '/business/debts', icon: CreditCard },
    { name: 'Payment Ledger', path: '/business/payments', icon: CreditCard },
    { name: 'Expenses', path: '/business/expenses', icon: TrendingDown },
    { name: 'Reports & Analytics', path: '/business/reports', icon: FileText },
    { name: 'Settings', path: '/business/settings', icon: Settings },
  ];

  return (
    <div className="h-screen h-[100dvh] w-full max-w-full overflow-hidden bg-brand-bg flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-brand-navy text-white px-4 py-3 flex items-center justify-between shadow-md z-30 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="bg-white px-2.5 py-1 rounded-xl shadow-sm flex items-center justify-center shrink-0">
            <img
              src={tenant?.logoUrl || '/logo.png'}
              alt="Logo"
              className="h-7 max-w-[110px] object-contain"
              onError={(e) => {
                (e.target as any).src = '/logo.png';
              }}
            />
          </div>
          <div className="truncate">
            <span className="font-extrabold text-xs tracking-wide text-brand-amber truncate block">
              {tenant?.name || 'Maraayn Business'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-brand-navy-light"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
        />
      )}

      {/* Business Sidebar - Pure Flex on Desktop (md:static h-full), Fixed Drawer on Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 md:static h-full w-64 shrink-0 bg-brand-navy text-slate-300 flex flex-col z-40 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Business Branding Header */}
        <div className="p-5 border-b border-slate-700/60 flex items-center space-x-3">
          <div className="bg-white px-2.5 py-1.5 rounded-xl shadow-sm flex items-center justify-center shrink-0">
            <img
              src={tenant?.logoUrl || '/logo.png'}
              alt={tenant?.name}
              className="h-8 max-w-[110px] object-contain"
              onError={(e) => {
                (e.target as any).src = '/logo.png';
              }}
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-white text-sm truncate tracking-tight">
              {tenant?.name || 'Maraayn Business'}
            </h1>
            <p className="text-[11px] text-brand-amber font-semibold truncate">
              {tenant?.category || 'Retail Store'}
            </p>
          </div>
        </div>

        {/* Quick New Sale Action */}
        <div className="px-4 pt-4">
          <NavLink
            to="/business/sales/new"
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center justify-center space-x-2 bg-brand-amber hover:bg-brand-amber-light text-brand-navy font-bold py-2.5 px-3 rounded-xl text-xs transition-colors shadow-md shadow-brand-amber/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Sale (POS)</span>
          </NavLink>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/business'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-amber text-brand-navy font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Storage Bar in Sidebar Bottom */}
        <div className="px-4 py-3 bg-slate-900/40 border-t border-slate-700/60">
          <StorageMeter
            usedBytes={tenant?.storageUsedBytes || 0}
            quotaBytes={tenant?.storageQuotaBytes || 4 * 1024 * 1024 * 1024}
            compact={true}
          />
        </div>

        {/* User Profile & Logout Bottom */}
        <div className="p-4 pb-10 md:pb-4 border-t border-slate-700/60 bg-brand-navy-dark/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-brand-amber text-brand-navy font-bold flex items-center justify-center text-xs shrink-0">
                {user?.name?.slice(0, 2).toUpperCase() || 'BW'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-brand-amber truncate font-mono">
                  {user?.businessRole || 'Owner'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-300 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors bg-slate-800/40 border border-slate-700/40 shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace - Natural Flex Sibling with Independent Smooth Scroll */}
      <div className="flex-1 h-full flex flex-col min-w-0 w-full overflow-y-auto overflow-x-hidden">
        {/* Workspace Top Header */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-8 py-3.5 items-center justify-between sticky top-0 z-20 shadow-sm shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              {tenant?.name} — <span className="text-slate-500 font-normal">Maraayn Business</span>
            </h2>
            <p className="text-xs text-brand-amber font-semibold">Your Business, In One Place</p>
          </div>

          <div className="flex items-center space-x-4">
            <StorageMeter
              usedBytes={tenant?.storageUsedBytes || 0}
              quotaBytes={tenant?.storageQuotaBytes || 4 * 1024 * 1024 * 1024}
              compact={true}
            />
            <div className="h-5 w-px bg-slate-200" />
            <NotificationsDropdown />
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {user?.businessRole || 'Staff'}
              </span>
            </div>
          </div>
        </header>

        {/* Suspension Banner if Suspended */}
        {isSuspended && (
          <div className="bg-rose-600 text-white px-6 py-3 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-2 text-xs font-semibold">
              <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />
              <span>
                BUSINESS SUSPENDED: {tenant?.suspensionReason || 'Storage quota exceeded'}. Please contact Maraayn Administration.
              </span>
            </div>
          </div>
        )}

        {/* Content Outlet */}
        <main className="flex-1 w-full min-w-0 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

