import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

import useDashboard        from '../hooks/useDashboard';
import useAuthStore        from '../store/authStore';
import MonthSelector       from '../components/dashboard/MonthSelector';
import KpiCard             from '../components/dashboard/KpiCard';
import SavingsSection      from '../components/dashboard/SavingsSection';
import RecentTransactions  from '../components/dashboard/RecentTransactions';
import UpcomingRecurring   from '../components/dashboard/UpcomingRecurring';
import IncomeExpenseBar    from '../components/charts/IncomeExpenseBar';
import WeeklyFlowChart     from '../components/charts/WeeklyFlowChart';
import ExpensePie          from '../components/charts/ExpensePie';
import BalanceLine         from '../components/charts/BalanceLine';
import DailyFlowChart      from '../components/charts/DailyFlowChart';
import { formatCurrency }  from '../utils/formatCurrency';

export default function DashboardPage() {
  const user     = useAuthStore((s) => s.user);
  const now      = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear ] = useState(now.getFullYear());

  const { data, loading, error, refetch } = useDashboard(month, year);

  const handleMonthChange = (m, y) => { setMonth(m); setYear(y); };

  const totalBalance = (data?.accounts?.reduce((s, a) => s + Math.round(Number(a.balance) * 100), 0) ?? 0) / 100;

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <span className="text-5xl">😔</span>
      <p className="text-gray-600 dark:text-gray-300">{error}</p>
      <button onClick={refetch} className="btn-primary w-auto px-6 py-2.5">
        <RefreshCw className="w-4 h-4" /> Reintentar
      </button>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Saludo + selector de mes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white">
            ¡Hola, {user?.name?.split(' ')[0] || 'Usuario'}! 👋
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Aquí está el resumen de tus finanzas
          </p>
        </div>
        <MonthSelector month={month} year={year} onChange={handleMonthChange} />
      </div>

      {/* KPI Cards */}
      {loading ? <KpiSkeleton /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Saldo Total"
            value={totalBalance}
            icon="💰"
            gradient="from-violet-500 to-purple-600"
            light="bg-violet-50 dark:bg-violet-900/20"
            textColor="text-violet-700 dark:text-violet-300"
          />
          <KpiCard
            title="Ingresos del mes"
            value={data?.monthly?.income ?? 0}
            icon="📈"
            gradient="from-emerald-500 to-teal-600"
            light="bg-emerald-50 dark:bg-emerald-900/20"
            textColor="text-emerald-700 dark:text-emerald-300"
          />
          <KpiCard
            title="Egresos del mes"
            value={data?.monthly?.expense ?? 0}
            icon="📉"
            gradient="from-rose-500 to-pink-600"
            light="bg-rose-50 dark:bg-rose-900/20"
            textColor="text-rose-700 dark:text-rose-300"
          />
          <KpiCard
            title="Neto del mes"
            value={data?.monthly?.net ?? 0}
            icon="⚖️"
            gradient="from-blue-500 to-indigo-600"
            light="bg-blue-50 dark:bg-blue-900/20"
            textColor={(data?.monthly?.net ?? 0) >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-700 dark:text-rose-300'}
          />
        </div>
      )}

      {/* Fila: flujo semanal + pie de categorías */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton /> <ChartSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data?.weekly?.length > 0 && (
            <WeeklyFlowChart data={data.weekly} month={month} year={year} />
          )}
          <ExpensePie data={data?.byCategory ?? []} />
        </div>
      )}

      {/* Flujo diario — full width */}
      {loading ? <ChartSkeleton /> : (
        <DailyFlowChart data={data?.daily ?? []} month={month} year={year} />
      )}

      {/* Gráfica evolución — full width */}
      {loading ? <ChartSkeleton tall /> : (
        data?.evolution?.length > 0 && <IncomeExpenseBar data={data.evolution} />
      )}

      {/* Balance line — full width */}
      {loading ? <ChartSkeleton /> : (
        data?.evolution?.length > 0 && <BalanceLine data={data.evolution} />
      )}

      {/* Fila: ahorros + recurrentes próximas */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton /> <ChartSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SavingsSection accounts={data?.accounts ?? []} />
          <UpcomingRecurring rules={data?.recurring ?? []} />
        </div>
      )}

      {/* Transacciones recientes — full width */}
      {loading ? <ChartSkeleton /> : (
        <RecentTransactions transactions={data?.recent ?? []} />
      )}
    </div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[1,2,3,4].map((i) => (
        <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      ))}
    </div>
  );
}

function ChartSkeleton({ tall }) {
  return (
    <div className={`${tall ? 'h-72' : 'h-56'} bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse`} />
  );
}
