import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';

// Layouts
import { AdminLayout } from './components/layout/AdminLayout.js';
import { BusinessLayout } from './components/layout/BusinessLayout.js';

// Auth
import { LoginPage } from './pages/auth/LoginPage.js';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.js';
import { AllMarketsPage } from './pages/admin/AllMarketsPage.js';
import { AddNewMarketPage } from './pages/admin/AddNewMarketPage.js';
import { AdminUsersPage } from './pages/admin/AdminUsersPage.js';
import { AdminReportsPage } from './pages/admin/AdminReportsPage.js';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage.js';

// Business Pages
import { BusinessDashboardPage } from './pages/business/BusinessDashboardPage.js';
import { ProductsPage } from './pages/business/ProductsPage.js';
import { CustomersPage } from './pages/business/CustomersPage.js';
import { NewSalePage } from './pages/business/NewSalePage.js';
import { SalesHistoryPage } from './pages/business/SalesHistoryPage.js';
import { DebtsPage } from './pages/business/DebtsPage.js';
import { PaymentsPage } from './pages/business/PaymentsPage.js';
import { ExpensesPage } from './pages/business/ExpensesPage.js';
import { BusinessReportsPage } from './pages/business/BusinessReportsPage.js';
import { BusinessSettingsPage } from './pages/business/BusinessSettingsPage.js';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt.js';

// Protected Route Guard
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200/60 mb-3 animate-pulse">
          <img src="/logo.png" alt="Maraayn" className="h-10 object-contain" />
        </div>
        <p className="text-xs font-bold text-slate-500">Maraayn Management System...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.platformRole)) {
    if (user.platformRole === 'BUSINESS_USER') {
      return <Navigate to="/business" replace />;
    } else {
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
};

// Index Redirector
const IndexRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user.platformRole === 'SUPER_ADMIN' || user.platformRole === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/business" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Index Route */}
          <Route path="/" element={<IndexRedirect />} />

          {/* Public Auth */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Control Center Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="markets" element={<AllMarketsPage />} />
            <Route path="markets/new" element={<AddNewMarketPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Business Workspace Routes */}
          <Route
            path="/business"
            element={
              <ProtectedRoute allowedRoles={['BUSINESS_USER']}>
                <BusinessLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<BusinessDashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="sales/new" element={<NewSalePage />} />
            <Route path="sales" element={<SalesHistoryPage />} />
            <Route path="debts" element={<DebtsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="reports" element={<BusinessReportsPage />} />
            <Route path="settings" element={<BusinessSettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <PwaInstallPrompt />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
