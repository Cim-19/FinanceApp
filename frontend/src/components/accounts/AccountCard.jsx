import { Pencil, Trash2, ArrowLeftRight, Target } from 'lucide-react';
import { ACCOUNT_TYPES, iconEmoji } from '../../utils/accountTypes';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate }     from '../../utils/formatDate';

export default function AccountCard({ account, onEdit, onDelete, onTransfer, onGoal }) {
  const meta    = ACCOUNT_TYPES[account.type];
  const Icon    = meta.icon;
  const goal    = account.savingGoal;
  const balance = Number(account.balance);

  const progress = goal
    ? Math.min((balance / Number(goal.targetAmount)) * 100, 100)
    : 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-card border ${meta.border} overflow-hidden group transition-all hover:shadow-lg hover:-translate-y-0.5 duration-200`}>

      {/* Header con gradiente */}
      <div className={`bg-gradient-to-r ${meta.gradient} p-4 relative overflow-hidden`}>
        <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute right-6 bottom-0 w-14 h-14 bg-white/10 rounded-full translate-y-6" />

        <div className="relative flex items-start justify-between">
          {/* Ícono + nombre */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-2xl shadow-sm">
              {iconEmoji(account.icon)}
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">{account.name}</p>
              <span className="inline-flex items-center gap-1 mt-0.5 text-white/80 text-xs">
                <Icon className="w-3 h-3" />
                {meta.label}
              </span>
            </div>
          </div>

          {/* Acciones (aparecen en hover) */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {account.type === 'AHORRO' && onGoal && (
              <button onClick={() => onGoal(account)}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition" title="Meta de ahorro">
                <Target className="w-3.5 h-3.5 text-white" />
              </button>
            )}
            <button onClick={() => onTransfer(account)}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition" title="Transferir">
              <ArrowLeftRight className="w-3.5 h-3.5 text-white" />
            </button>
            <button onClick={() => onEdit(account)}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition" title="Editar">
              <Pencil className="w-3.5 h-3.5 text-white" />
            </button>
            <button onClick={() => onDelete(account)}
              className="p-1.5 bg-white/20 hover:bg-red-400/60 rounded-lg transition" title="Eliminar">
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>

        {/* Saldo */}
        <div className="relative mt-4">
          <p className="text-white/70 text-xs font-medium">Saldo disponible</p>
          <p className="text-white text-2xl font-bold tracking-tight mt-0.5">
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      {/* Footer — meta de ahorro */}
      {goal && (
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Target className="w-3.5 h-3.5" />
              <span>Meta: <span className="font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(goal.targetAmount)}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{progress.toFixed(0)}%</span>
              {onGoal && (
                <button onClick={() => onGoal(account)} className="p-1 lg:hidden text-gray-400 hover:text-emerald-600 rounded transition" title="Editar meta">
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress >= 100 ? 'bg-emerald-500' :
                progress >= 60  ? 'bg-teal-500' :
                progress >= 30  ? 'bg-blue-500' : 'bg-violet-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {goal.deadline && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Fecha límite: {formatDate(goal.deadline)}
            </p>
          )}
        </div>
      )}

      {/* Footer sin meta */}
      {!goal && (
        <div className="px-4 py-2.5 flex items-center justify-between">
          <span className={`badge text-xs ${meta.badge}`}>
            {meta.emoji} {meta.label}
          </span>
          <div className="flex gap-1 lg:hidden">
            {account.type === 'AHORRO' && onGoal && (
              <button onClick={() => onGoal(account)} className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg transition" title="Meta de ahorro">
                <Target className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => onTransfer(account)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition">
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit(account)} className="p-1.5 text-gray-400 hover:text-violet-600 rounded-lg transition">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(account)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
