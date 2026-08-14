import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, Settings, ChevronDown } from 'lucide-react';
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

const PLAN_META = {
  FREE:   { label: 'Free',   emoji: '🆓', badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
  PRO:    { label: 'Pro',    emoji: '⭐', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  FAMILY: { label: 'Family', emoji: '👨‍👩‍👧', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
};

export default function Navbar() {
  const { pathname }            = useLocation();
  const navigate                = useNavigate();
  const { isDark, toggle }      = useThemeStore();
  const { user, clearAuth }     = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const page     = PAGE_TITLES[pathname] || { label: 'FinanceApp', emoji: '🐷' };
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';
  const planMeta = PLAN_META[user?.plan] || PLAN_META.FREE;

  // Cierra el menú al hacer clic afuera, con Escape, o al navegar de página
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    const onKey   = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

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

        {/* Cuenta — avatar + menú con plan y accesos rápidos */}
        <div className="relative ml-1" ref={menuRef}>
          <button onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 p-1 transition"
            aria-haspopup="true" aria-expanded={menuOpen} title={user?.name}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">{initials}</span>
            </div>
            <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[11px] font-semibold ${planMeta.badge}`}>
                  {planMeta.emoji} Plan {planMeta.label}
                </span>
              </div>
              <button onClick={() => navigate('/settings')}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <Settings className="w-4 h-4" /> Configuración
              </button>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition">
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
