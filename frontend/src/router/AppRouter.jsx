import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

import LandingPage        from '../pages/LandingPage';
import LoginPage          from '../pages/auth/LoginPage';
import RegisterPage       from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage  from '../pages/auth/ResetPasswordPage';

import AppLayout          from '../components/layout/AppLayout';
import DashboardPage      from '../pages/DashboardPage';
import AccountsPage       from '../pages/AccountsPage';
import TransactionsPage   from '../pages/TransactionsPage';
import BudgetsPage        from '../pages/BudgetsPage';
import CategoriesPage     from '../pages/CategoriesPage';
import ReportsPage        from '../pages/ReportsPage';
import SettingsPage       from '../pages/SettingsPage';
import AdminDashboard     from '../pages/admin/AdminDashboard';
import AdminUsersPage     from '../pages/admin/AdminUsersPage';
import AdminConfigPage    from '../pages/admin/AdminConfigPage';
import FamilyPage         from '../pages/FamilyPage';
import JoinFamilyPage     from '../pages/JoinFamilyPage';

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((s) => s.accessToken);
  return token ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const token = useAuthStore((s) => s.accessToken);
  return !token ? children : <Navigate to="/dashboard" replace />;
};

// El backend ya rechaza estos endpoints para no-admins; este guard evita que
// la UI de admin siquiera se renderice (y dispare sus llamadas a la API) para
// cualquier otro usuario autenticado.
const AdminRoute = ({ children }) => {
  const token = useAuthStore((s) => s.accessToken);
  const role  = useAuthStore((s) => s.user?.role);
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
};

export default function AppRouter() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Landing — redirige al dashboard si ya hay sesión */}
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />

        {/* Rutas públicas (redirigen al dashboard si ya hay sesión) */}
        <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register"        element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password"  element={<PublicRoute><ResetPasswordPage  /></PublicRoute>} />

        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard"    element={<DashboardPage />} />
          <Route path="/accounts"     element={<AccountsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/budgets"      element={<BudgetsPage />} />
          <Route path="/categories"   element={<CategoriesPage />} />
          <Route path="/reports"      element={<ReportsPage />} />
          <Route path="/settings"     element={<SettingsPage />} />
          <Route path="/family"           element={<FamilyPage />} />
          <Route path="/family/join/:token" element={<JoinFamilyPage />} />
          <Route path="/admin"         element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users"  element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
          <Route path="/admin/config" element={<AdminRoute><AdminConfigPage /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
