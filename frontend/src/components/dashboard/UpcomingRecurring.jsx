import { Link } from 'react-router-dom';
import { RefreshCw, ArrowRight, Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const FREQ_LABEL = { DAILY: 'Diario', WEEKLY: 'Semanal', MONTHLY: 'Mensual', YEARLY: 'Anual' };

function daysUntil(dateStr) {
  const diff = new Date(dateStr).setHours(0,0,0,0) - new Date().setHours(0,0,0,0);
  const days = Math.round(diff / 86400000);
  if (days < 0)  return { label: 'Vencido',    color: 'text-rose-500' };
  if (days === 0) return { label: 'Hoy',        color: 'text-amber-500 font-bold' };
  if (days === 1) return { label: 'Mañana',     color: 'text-amber-400' };
  return { label: `En ${days} días`, color: 'text-gray-400' };
}

export default function UpcomingRecurring({ rules }) {
  const upcoming = [...rules]
    .sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate))
    .slice(0, 5);

  if (upcoming.length === 0) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-violet-500" />
          <h3 className="font-bold text-gray-800 dark:text-white">Próximas recurrentes</h3>
        </div>
        <Link to="/transactions" className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-medium hover:underline">
          Ver todas <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {upcoming.map((rule) => {
          const tx     = rule.transaction;
          const until  = daysUntil(rule.nextDate);
          const isIncome = tx.type === 'INGRESO';

          return (
            <div key={rule.id} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0
                ${isIncome ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
                {tx.category?.icon || '🔄'}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                  {tx.description || tx.category?.name || 'Sin descripción'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    <Calendar className="w-3 h-3" />
                    {FREQ_LABEL[rule.frequency]}
                  </span>
                  <span className={`text-[10px] ${until.color}`}>{until.label}</span>
                </div>
              </div>

              <span className={`text-sm font-bold flex-shrink-0 ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
