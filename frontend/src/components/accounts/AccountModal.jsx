import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { ACCOUNT_TYPES, ACCOUNT_ICONS, ACCOUNT_COLORS } from '../../utils/accountTypes';

const TYPES = Object.entries(ACCOUNT_TYPES).map(([value, meta]) => ({
  value, label: meta.label, emoji: meta.emoji, gradient: meta.gradient,
}));

const empty = {
  name: '', type: 'CORRIENTE', color: '#6366f1', icon: 'wallet',
  balance: '',
  savingGoal: { targetAmount: '', deadline: '' },
};

export default function AccountModal({ open, onClose, onSave, initial }) {
  const [form,    setForm   ] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      setForm(initial
        ? {
            name:    initial.name,
            type:    initial.type,
            color:   initial.color,
            icon:    initial.icon,
            balance: '',
            savingGoal: {
              targetAmount: initial.savingGoal?.targetAmount ?? '',
              deadline:     initial.savingGoal?.deadline
                ? initial.savingGoal.deadline.split('T')[0]
                : '',
            },
          }
        : empty
      );
    }
  }, [open, initial]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setGoal = (key, val) => setForm((f) => ({ ...f, savingGoal: { ...f.savingGoal, [key]: val } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        name:  form.name.trim(),
        type:  form.type,
        color: form.color,
        icon:  form.icon,
        ...(!initial && { balance: Number(form.balance) || 0 }),
        ...(form.type === 'AHORRO' && form.savingGoal.targetAmount
          ? { savingGoal: {
              targetAmount: Number(form.savingGoal.targetAmount),
              deadline:     form.savingGoal.deadline || null,
            }}
          : {}),
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              {initial ? '✏️ Editar cuenta' : '➕ Nueva cuenta'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {initial ? 'Modifica los datos de tu cuenta' : 'Agrega una nueva cuenta a tu perfil'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">⚠️ {error}</div>
          )}

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de cuenta</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => set('type', t.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-left
                    ${form.type === t.value
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center text-sm flex-shrink-0`}>
                    {t.emoji}
                  </div>
                  <span className={`text-sm font-medium ${form.type === t.value ? 'text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {t.label}
                  </span>
                  {form.type === t.value && <Check className="w-4 h-4 text-violet-500 ml-auto flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre de la cuenta</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)}
              className="input-base" placeholder="Ej: BCP Ahorros, Efectivo, etc." required />
          </div>

          {/* Saldo inicial — solo al crear */}
          {!initial && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Saldo inicial</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">S/.</span>
                <input type="number" min="0" step="0.01" value={form.balance}
                  onChange={(e) => set('balance', e.target.value)}
                  className="input-base pl-10" placeholder="0.00" />
              </div>
            </div>
          )}

          {/* Ícono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ícono</label>
            <div className="grid grid-cols-5 gap-2">
              {ACCOUNT_ICONS.map((ic) => (
                <button key={ic.value} type="button" onClick={() => set('icon', ic.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all
                    ${form.icon === ic.value
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  <span className="text-xl">{ic.emoji}</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight text-center">{ic.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => set('color', c)}
                  className={`w-8 h-8 rounded-xl transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Meta de ahorro — solo tipo AHORRO */}
          {form.type === 'AHORRO' && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                🎯 Meta de ahorro <span className="font-normal text-emerald-500">(opcional)</span>
              </p>
              <div>
                <label className="block text-xs text-emerald-600 dark:text-emerald-400 mb-1">Monto objetivo</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">S/.</span>
                  <input type="number" min="1" step="0.01" value={form.savingGoal.targetAmount}
                    onChange={(e) => setGoal('targetAmount', e.target.value)}
                    className="input-base pl-10" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-emerald-600 dark:text-emerald-400 mb-1">Fecha límite</label>
                <input type="date" value={form.savingGoal.deadline}
                  onChange={(e) => setGoal('deadline', e.target.value)}
                  className="input-base" min={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : initial ? 'Guardar cambios' : 'Crear cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}
