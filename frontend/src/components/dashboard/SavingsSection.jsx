import { Link } from 'react-router-dom';
import { ArrowRight, Target, Clock, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate }     from '../../utils/formatDate';

function daysLeft(deadline) {
  const diff = new Date(deadline).setHours(0,0,0,0) - new Date().setHours(0,0,0,0);
  return Math.ceil(diff / 86400000);
}

export default function SavingsSection({ accounts }) {
  const savings = accounts.filter((a) => a.type === 'AHORRO');
  if (savings.length === 0) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐷</span>
          <h3 className="font-bold text-gray-800 dark:text-white">Mis Ahorros</h3>
        </div>
        <Link to="/accounts" className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-medium hover:underline">
          Ver todo <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-5">
        {savings.map((account) => {
          const balance  = Number(account.balance);
          const goal     = account.savingGoal;
          const target   = goal ? Number(goal.targetAmount) : 0;
          const progress = target > 0 ? Math.min((balance / target) * 100, 100) : 0;
          const remaining = target > 0 ? Math.max(target - balance, 0) : 0;

          const days     = goal?.deadline ? daysLeft(goal.deadline) : null;
          const months   = days !== null ? days / 30 : null;
          const perMonth = months > 0 && remaining > 0 ? remaining / months : null;

          const progressColor =
            progress >= 100 ? 'bg-emerald-500' :
            progress >= 75  ? 'bg-teal-500'    :
            progress >= 40  ? 'bg-blue-500'    : 'bg-violet-500';

          return (
            <div key={account.id}>
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-base flex-shrink-0">
                    🐷
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{account.name}</p>
                    {goal?.deadline && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {formatDate(goal.deadline, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(balance)}</p>
                  {goal && <p className="text-xs text-gray-400">de {formatCurrency(target)}</p>}
                </div>
              </div>

              {/* Barra de progreso */}
              {goal && (
                <>
                  <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="font-medium" style={{ color: progress >= 100 ? '#10b981' : undefined }}>
                      {progress.toFixed(0)}% completado
                    </span>
                    {progress < 100 && (
                      <span>Faltan {formatCurrency(remaining)}</span>
                    )}
                    {progress >= 100 && (
                      <span className="text-emerald-500 font-semibold">¡Meta alcanzada! 🎉</span>
                    )}
                  </div>

                  {/* Info adicional */}
                  <div className="flex gap-3 mt-2">
                    {days !== null && days > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock className="w-3 h-3" />
                        {days} días restantes
                      </div>
                    )}
                    {days !== null && days <= 0 && progress < 100 && (
                      <div className="flex items-center gap-1 text-[11px] text-rose-500">
                        <Clock className="w-3 h-3" />
                        Plazo vencido
                      </div>
                    )}
                    {perMonth !== null && progress < 100 && (
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <TrendingUp className="w-3 h-3" />
                        {formatCurrency(perMonth)}/mes necesarios
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Sin meta: solo saldo */}
              {!goal && (
                <div className="mt-1">
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full opacity-40" />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Sin meta asignada</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
