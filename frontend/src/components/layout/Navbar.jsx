import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut } from 'lucide-react';
import useThemeStore      from '../../store/themeStore';
import useAuthStore       from '../../store/authStore';
import { logout }         from '../../api/auth';
import NotificationBell   from './NotificationBell';
import GlobalSearch       from './GlobalSearch';

const PAGE_TITLES = {
  '/dashboard':    { label: 'Dashboard',     emoji: '🏠' },
  '/transactions': { label: 'Transacciones', emoji: '💸' },
  '/accounts':     { label: 'Cuentas',       emoji: '🏦' },
  '/budgets':      { label: 'Presupuestos',  emoji: '🎯' },
  '/reports':      { label: 'Reportes',      emoji: '📊' },
  '/settings':     { label: 'Configuración', emoji: '⚙️' },
};

export default function Navbar() {
  const { pathname }            = useLocation();
  const navigate                = useNavigate();
  const { isDark, toggle }      = useThemeStore();
  const { user, clearAuth }     = useAuthStore();

  const page     = PAGE_TITLES[pathname] || { label: 'FinanceApp', emoji: '🐷' };
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 z-10">

      {/* Título de página — solo desktop */}
      <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
        <span className="text-2xl">{page.emoji}</span>
        <h1 className="text-lg font-bold text-gray-800 dark:text-white">{page.label}</h1>
      </div>

      {/* Búsqueda global */}
      <GlobalSearch />

      {/* Acciones */}
      <div className="flex items-center gap-2 flex-shrink-0">

        <NotificationBell />

        {/* Tema */}
        <button onClick={toggle}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center cursor-pointer ml-1" title={user?.name}>
          <span className="text-white text-sm font-bold">{initials}</span>
        </div>

        {/* Logout — visible en todos los tamaños */}
        <button onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition" title="Cerrar sesión">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
