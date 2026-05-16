import { useState, useEffect } from 'react';
import { Users, ArrowLeftRight, CreditCard, Target, TrendingUp, UserCheck, UserX, UserPlus } from 'lucide-react';
import { getAdminStats } from '../../api/admin';
import { formatCurrency } from '../../utils/formatCurrency';

function StatCard({ icon: Icon, label, value, gradient, sub }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-800 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats,   setStats  ] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl" />)}
    </div>
  );

  if (!stats) return null;

  const planColors = { FREE: 'bg-gray-200 dark:bg-gray-700', PRO: 'bg-violet-500', FAMILY: 'bg-amber-400' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white">Panel de Administración</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Vista global del sistema</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}         label="Usuarios totales"   value={stats.totalUsers}       gradient="from-violet-500 to-purple-600" />
        <StatCard icon={UserCheck}     label="Usuarios activos"   value={stats.activeUsers}      gradient="from-emerald-500 to-teal-600" />
        <StatCard icon={UserX}         label="Desactivados"       value={stats.bannedUsers}      gradient="from-rose-500 to-pink-600" />
        <StatCard icon={UserPlus}      label="Nuevos este mes"    value={stats.newUsersThisMonth} gradient="from-blue-500 to-indigo-600" />
        <StatCard icon={ArrowLeftRight} label="Transacciones"     value={stats.totalTransactions.toLocaleString()} gradient="from-amber-500 to-orange-600" />
        <StatCard icon={CreditCard}    label="Cuentas"            value={stats.totalAccounts}    gradient="from-fuchsia-500 to-pink-600" />
        <StatCard icon={Target}        label="Presupuestos"       value={stats.totalBudgets}     gradient="from-cyan-500 to-blue-600" />
        <StatCard icon={TrendingUp}    label="Promedio TX/usuario" value={stats.totalUsers > 0 ? Math.round(stats.totalTransactions / stats.totalUsers) : 0} gradient="from-lime-500 to-green-600" />
      </div>

      {/* Plan breakdown */}
      <div className="card">
        <h3 className="font-bold text-gray-800 dark:text-white mb-4">Distribución de planes</h3>
        <div className="space-y-3">
          {[
            { key: 'FREE',   label: 'Free',   emoji: '🆓', color: 'bg-gray-400' },
            { key: 'PRO',    label: 'Pro',    emoji: '⭐', color: 'bg-violet-500' },
            { key: 'FAMILY', label: 'Family', emoji: '👨‍👩‍👧', color: 'bg-amber-400' },
          ].map(({ key, label, emoji, color }) => {
            const count = stats.plans[key] || 0;
            const pct   = stats.totalUsers > 0 ? Math.round((count / stats.totalUsers) * 100) : 0;
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-lg w-7">{emoji}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-16">{label}</span>
                <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${color}`}
                    style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200 w-8 text-right">{count}</span>
                <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
