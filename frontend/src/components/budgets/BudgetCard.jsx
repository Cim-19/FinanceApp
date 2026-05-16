import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

function pct(spent, amount) {
  if (!amount) return 0;
  return Math.min((spent / amount) * 100, 100);
}

function barColor(ratio) {
  if (ratio >= 100) return 'bg-rose-500';
  if (ratio >= 80)  return 'bg-amber-400';
  return 'bg-emerald-500';
}

function textColor(ratio) {
  if (ratio >= 100) return 'text-rose-600 dark:text-rose-400';
  if (ratio >= 80)  return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

export default function BudgetCard({ budget, onEdit, onDelete }) {
  const spent   = Number(budget.spent  || 0);
  const amount  = Number(budget.amount || 0);
  const ratio   = amount ? (spent / amount) * 100 : 0;
  const over    = spent > amount;
  const warning = ratio >= 80;

  return (
    <div className="card group hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{
              backgroundColor: (budget.category?.color || '#6366f1') + '22',
              border: `2px solid ${(budget.category?.color || '#6366f1')}33`,
            }}>
            {budget.category?.icon || '📦'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">
              {budget.category?.name || 'Sin categoría'}
            </p>
            {warning && (
              <div className={`flex items-center gap-1 text-xs font-medium mt-0.5 ${textColor(ratio)}`}>
                <AlertTriangle className="w-3 h-3" />
                {over ? 'Superado' : `${ratio.toFixed(0)}% usado`}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onEdit(budget)}
            className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(budget)}
            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor(ratio)}`}
          style={{ width: `${pct(spent, amount)}%` }}
        />
      </div>

      {/* Amounts */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">
          Gastado: <span className={`font-semibold ${textColor(ratio)}`}>{formatCurrency(spent)}</span>
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          Límite: <span className="font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(amount)}</span>
        </span>
      </div>
    </div>
  );
}
