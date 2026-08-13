import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, CreditCard,
  Target, BarChart3, Settings, LogOut, Tag, ShieldCheck, Users, SlidersHorizontal, Home,
} from 'lucide-react';
import useAuthStore   from '../../store/authStore';
import { logout }     from '../../api/auth';
import { clearUserDataCaches } from '../../utils/clearAppCaches';

const ADMIN_NAV = [
  { to: '/admin',         label: 'Stats globales', icon: ShieldCheck,       grad: 'from-rose-500 to-red-600',     bg: 'bg-rose-50    dark:bg-rose-900/30'   },
  { to: '/admin/users',   label: 'Usuarios',       icon: Users,             grad: 'from-orange-500 to-amber-600', bg: 'bg-orange-50  dark:bg-orange-900/30' },
  { to: '/admin/config',  label: 'Config sistema', icon: SlidersHorizontal, grad: 'from-teal-500 to-cyan-600',    bg: 'bg-teal-50    dark:bg-teal-900/30'   },
];

const NAV = [
  { to: '/dashboard',    label: 'Dashboard',      icon: LayoutDashboard, grad: 'from-violet-500 to-purple-600',  bg: 'bg-violet-50  dark:bg-violet-900/30' },
  { to: '/transactions', label: 'Transacciones',  icon: ArrowLeftRight,  grad: 'from-blue-500 to-indigo-600',    bg: 'bg-blue-50    dark:bg-blue-900/30'   },
  { to: '/accounts',     label: 'Cuentas',        icon: CreditCard,      grad: 'from-emerald-500 to-teal-600',   bg: 'bg-emerald-50 dark:bg-emerald-900/30'},
  { to: '/budgets',      label: 'Presupuestos',   icon: Target,          grad: 'from-amber-500 to-orange-600',   bg: 'bg-amber-50   dark:bg-amber-900/30'  },
  { to: '/categories',   label: 'Categorías',     icon: Tag,             grad: 'from-fuchsia-500 to-pink-600',   bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/30'},
  { to: '/reports',      label: 'Reportes',       icon: BarChart3,       grad: 'from-pink-500 to-rose-600',      bg: 'bg-pink-50    dark:bg-pink-900/30'   },
  { to: '/settings',     label: 'Configuración',  icon: Settings,        grad: 'from-gray-500 to-slate-600',     bg: 'bg-gray-50    dark:bg-gray-700/30'   },
];

function NavItem({ to, label, Icon, grad, bg }) {
  return (
    <NavLink to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group
         ${isActive
          ? `${bg} border border-gray-200 dark:border-gray-700/50`
          : 'hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent'}`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all
            ${isActive
              ? `bg-gradient-to-br ${grad} shadow-md`
              : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'}`}>
            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`} />
          </div>
          <span className={`text-sm font-medium ${isActive ? 'text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200'}`}>
            {label}
          </span>
          {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500" />}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const navigate  = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    await clearUserDataCaches();
    clearAuth();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <div className="w-64 h-full flex flex-col bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 border-r border-gray-200 dark:border-gray-800">

      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-xl">🐷</span>
        </div>
        <div>
          <p className="text-gray-900 dark:text-white font-bold text-lg leading-none">FinanceApp</p>
          <p className="text-gray-400 dark:text-gray-400 text-xs mt-0.5">Tu dinero seguro</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, grad, bg }) => (
          <NavItem key={to} to={to} label={label} Icon={Icon} grad={grad} bg={bg} />
        ))}

        {/* Family — solo visible para plan Family */}
        {user?.plan === 'FAMILY' && (
          <NavItem to="/family" label="Mi Familia" Icon={Home}
            grad="from-violet-500 to-purple-600" bg="bg-violet-50 dark:bg-violet-900/30" />
        )}

        {/* Admin section — solo visible para ADMIN */}
        {user?.role === 'ADMIN' && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Administración</p>
            </div>
            {ADMIN_NAV.map(({ to, label, icon: Icon, grad, bg }) => (
              <NavItem key={to} to={to} label={label} Icon={Icon} grad={grad} bg={bg} />
            ))}
          </>
        )}
      </nav>

      {/* User card */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
        {/* Plan badge */}
        {user?.plan && user.plan !== 'FREE' && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
            ${user.plan === 'FAMILY'
              ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'}`}>
            <span>{user.plan === 'FAMILY' ? '👨‍👩‍👧' : '⭐'}</span>
            <span>Plan {user.plan === 'FAMILY' ? 'Familiar' : 'Pro'}</span>
          </div>
        )}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800/60">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-800 dark:text-white text-sm font-medium truncate">{user?.name || 'Usuario'}</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{user?.email || ''}</p>
          </div>
          <button onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition" title="Cerrar sesión">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
