import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, CreditCard, Target, BarChart3 } from 'lucide-react';

const NAV = [
  { to: '/dashboard',    label: 'Inicio',   icon: LayoutDashboard, grad: 'from-violet-500 to-purple-600' },
  { to: '/transactions', label: 'Movs.',    icon: ArrowLeftRight,  grad: 'from-blue-500 to-indigo-600'   },
  { to: '/accounts',     label: 'Cuentas',  icon: CreditCard,      grad: 'from-emerald-500 to-teal-600'  },
  { to: '/budgets',      label: 'Metas',    icon: Target,          grad: 'from-amber-500 to-orange-600'  },
  { to: '/reports',      label: 'Reportes', icon: BarChart3,       grad: 'from-pink-500 to-rose-600'     },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV.map(({ to, label, icon: Icon, grad }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all
               ${isActive ? '' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all
                  ${isActive ? `bg-gradient-to-br ${grad} shadow-md scale-110` : 'bg-transparent'}`}>
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-gray-800 dark:text-white' : 'text-gray-400'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
