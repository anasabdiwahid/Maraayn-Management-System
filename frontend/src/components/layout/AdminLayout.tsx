import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  PlusCircle,
  FileBarChart,
  Settings,
  Users,
  LogOut,
  Menu,
  X,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { NotificationsDropdown } from '../common/NotificationsDropdown.js';
import { ZoomController } from '../common/ZoomController.js';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const isSuperAdmin = user?.platformRole === 'SUPER_ADMIN';

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'All Markets', path: '/admin/markets', icon: Store },
    { name: 'Add New Market', path: '/admin/markets/new', icon: PlusCircle },
    ...(isSuperAdmin ? [{ name: 'Manage Admins', path: '/admin/users', icon: Users }] : []),
    { name: 'Reports', path: '/admin/reports', icon: FileBarChart },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="h-screen h-[100dvh] w-full max-w-full overflow-hidden bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-brand-navy text-white px-4 py-3 flex items-center justify-between shadow-md z-30 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="bg-white px-2.5 py-1 rounded-xl shadow-sm flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Maraayn" className="h-7 object-contain" />
          </div>
          <span className="font-extrabold text-sm tracking-wide text-brand-amber">CONTROL CENTER</span>
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

      {/* Admin Sidebar - Pure Flex on Desktop (md:static h-full), Fixed Drawer on Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 md:static h-full w-64 shrink-0 bg-brand-navy text-slate-300 flex flex-col z-40 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="p-5 border-b border-slate-700/60 flex items-center space-x-3">
          <div className="bg-white px-2.5 py-1.5 rounded-xl shadow-sm flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Maraayn Logo" className="h-8 object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-none">Maraayn</h1>
            <p className="text-[11px] text-brand-amber font-semibold mt-1">Control Center</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-amber text-brand-navy font-bold shadow-md shadow-brand-amber/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Logout Bottom Bar */}
        <div className="p-4 pb-10 md:pb-4 border-t border-slate-700/60 bg-brand-navy-dark/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-brand-amber text-brand-navy font-bold flex items-center justify-center text-xs shrink-0">
                {user?.name?.slice(0, 2).toUpperCase() || 'SA'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-brand-amber truncate font-mono">
                  {user?.platformRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
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

      {/* Main Content Area - Natural Flex Sibling with Independent Smooth Scroll */}
      <div className="flex-1 h-full flex flex-col min-w-0 w-full overflow-y-auto overflow-x-hidden">
        {/* Top Navbar */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-8 py-3.5 items-center justify-between sticky top-0 z-20 shadow-sm shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Maraayn Central Platform Administration</h2>
            <p className="text-xs text-slate-500">Your Business, In One Place</p>
          </div>
          <div className="flex items-center space-x-3.5">
            <ZoomController />
            <div className="h-6 w-px bg-slate-200" />
            <NotificationsDropdown />
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-brand-amber border border-amber-200">
                {user?.platformRole === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 w-full min-w-0 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

