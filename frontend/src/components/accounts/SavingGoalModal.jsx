import { useState, useEffect } from 'react';
import { X, Target, Trash2, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

function daysLeft(deadline) {
  const diff = new Date(deadline).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / 86400000);
}

export default function SavingGoalModal({ open, account, onClose, onSave, onDelete }) {
  const goal    = account?.savingGoal;
  const balance = account ? Number(account.balance) : 0;

  const [targetAmount, setTargetAmount] = useState('');
  const [deadline,     setDeadline    ] = useState('');
  const [saving,       setSaving      ] = useState(false);
  const [deleting,     setDeleting    ] = useState(false);
  const [error,        setError       ] = useState('');

  useEffect(() => {
    if (open) {
      setTargetAmount(goal ? String(goal.targetAmount) : '');
      setDeadline(goal?.deadline ? goal.deadline.slice(0, 10) : '');
      setError('');
    }
  }, [open, goal]);

  if (!open || !account) return null;

  const target   = parseFloat(targetAmount) || 0;
  const progress = target > 0 ? Math.min((balance / target) * 100, 100) : 0;
  const remaining = target > 0 ? Math.max(target - balance, 0) : 0;
  const days     = deadline ? daysLeft(deadline) : null;
  const months   = days !== null && days > 0 ? days / 30 : null;
  const perMonth = months && remaining > 0 ? remaining / months : null;

  const progressColor =
    progress >= 100 ? 'from-emerald-400 to-emerald-500' :
    progress >= 75  ? 'from-teal-400 to-teal-500'       :
    progress >= 40  ? 'from-blue-400 to-blue-500'        : 'from-violet-400 to-violet-500';

  const handleSave = async () => {
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      setError('Ingresa un monto objetivo válido');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(account.id, { targetAmount: parseFloat(targetAmount), deadline: deadline || null });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la meta');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(account.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar la meta');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
          <div className="absolute left-0 bottom-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
          <div className="relative flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-xl">🐷</div>
              <div>
                <p className="text-white font-bold text-sm">{account.name}</p>
                <p className="text-white/70 text-xs">Meta de ahorro</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Balance actual */}
          <div className="relative">
            <p className="text-white/70 text-xs">Saldo actual</p>
            <p className="text-white text-2xl font-extrabold">{formatCurrency(balance)}</p>
          </div>
        </div>

        <div className="p-5 space-y-5">

          {/* Preview barra de progreso */}
          {target > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Progreso</span>
                <span className="font-bold text-gray-800 dark:text-white">{progress.toFixed(1)}%</span>
              </div>

              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-500`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {progress >= 100 ? (
                <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  ¡Meta alcanzada! 🎉
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-gray-400" />
                    <div>
                      <p className="text-[10px] text-gray-400">Falta</p>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(remaining)}</p>
                    </div>
                  </div>
                  {perMonth && (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                      <div>
                        <p className="text-[10px] text-gray-400">Necesitas/mes</p>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(perMonth)}</p>
                      </div>
                    </div>
                  )}
                  {days !== null && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <div>
                        <p className="text-[10px] text-gray-400">Días restantes</p>
                        <p className={`text-xs font-semibold ${days <= 0 ? 'text-rose-500' : 'text-gray-700 dark:text-gray-200'}`}>
                          {days <= 0 ? 'Plazo vencido' : `${days} días`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                Monto objetivo *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">S/.</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0.00"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                Fecha límite <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="date"
                value={deadline}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDeadline(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-xl px-3 py-2">{error}</p>
          )}

          {/* Botones */}
          <div className="flex gap-3">
            {goal && (
              <button
                onClick={handleDelete}
                disabled={deleting || saving}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Eliminando…' : 'Eliminar meta'}
              </button>
            )}
            <div className="flex-1 flex gap-2">
              <button onClick={onClose} className="flex-1 btn-secondary text-sm py-2.5">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || deleting}
                className="flex-1 btn-primary text-sm py-2.5 disabled:opacity-50"
              >
                {saving ? 'Guardando…' : goal ? 'Actualizar meta' : 'Crear meta'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
