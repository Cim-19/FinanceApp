import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Tag, RefreshCw, ChevronDown } from 'lucide-react';
import { iconEmoji } from '../../utils/accountTypes';

const FREQUENCIES = [
  { value: 'DAILY',   label: 'Diario'   },
  { value: 'WEEKLY',  label: 'Semanal'  },
  { value: 'MONTHLY', label: 'Mensual'  },
  { value: 'YEARLY',  label: 'Anual'    },
];

const empty = {
  type: 'EGRESO', accountId: '', categoryId: '', amount: '',
  description: '', date: new Date().toISOString().split('T')[0],
  tags: '', isRecurring: false,
  recurringRule: { frequency: 'MONTHLY', nextDate: '', endDate: '' },
};

export default function TransactionModal({ open, onClose, onSave, initial, accounts, categories }) {
  const [form,    setForm   ] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState('');
  const [showRec, setShowRec] = useState(false);

  useEffect(() => {
    if (open) {
      setError('');
      setShowRec(false);
      if (initial) {
        setForm({
          type:        initial.type,
          accountId:   initial.accountId,
          categoryId:  initial.categoryId || '',
          amount:      String(Number(initial.amount)),
          description: initial.description || '',
          date:        initial.date?.split('T')[0] || empty.date,
          tags:        (initial.tags || []).join(', '),
          isRecurring: false,
          recurringRule: { frequency: 'MONTHLY', nextDate: '', endDate: '' },
        });
      } else {
        setForm({ ...empty, date: new Date().toISOString().split('T')[0] });
      }
    }
  }, [open, initial]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setRec = (k, v) => setForm((f) => ({ ...f, recurringRule: { ...f.recurringRule, [k]: v } }));

  const filteredCats = categories.filter((c) =>
    form.type === 'INGRESO' ? c.type !== 'EGRESO' : c.type !== 'INGRESO'
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.accountId) { setError('Selecciona una cuenta'); return; }
    if (!form.amount || Number(form.amount) <= 0) { setError('El monto debe ser mayor a 0'); return; }
    setLoading(true);
    setError('');
    try {
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      const payload = {
        type:        form.type,
        accountId:   form.accountId,
        categoryId:  form.categoryId || null,
        amount:      Number(form.amount),
        description: form.description || null,
        date:        form.date,
        tags,
        ...(form.isRecurring && form.recurringRule.nextDate
          ? { recurringRule: {
              frequency: form.recurringRule.frequency,
              nextDate:  form.recurringRule.nextDate,
              endDate:   form.recurringRule.endDate || null,
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

  const isIngreso = form.type === 'INGRESO';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[88svh] sm:max-h-[94vh] flex flex-col animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            {initial ? '✏️ Editar transacción' : '➕ Nueva transacción'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">⚠️ {error}</div>
          )}

          {/* Toggle tipo */}
          <div className="flex rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 p-1 gap-1 bg-gray-50 dark:bg-gray-800">
            <button type="button" onClick={() => set('type', 'EGRESO')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${!isIngreso ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
              <TrendingDown className="w-4 h-4" /> Egreso
            </button>
            <button type="button" onClick={() => set('type', 'INGRESO')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${isIngreso ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
              <TrendingUp className="w-4 h-4" /> Ingreso
            </button>
          </div>

          {/* Monto grande */}
          <div className={`rounded-2xl p-4 text-center ${isIngreso ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Monto</p>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-2xl font-bold ${isIngreso ? 'text-emerald-600' : 'text-rose-600'}`}>S/.</span>
              <input
                type="number" min="0.01" step="0.01" value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                className={`text-3xl font-extrabold bg-transparent border-none outline-none text-center w-40
                  ${isIngreso ? 'text-emerald-600' : 'text-rose-600'}`}
                placeholder="0.00" required
              />
            </div>
          </div>

          {/* Cuenta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cuenta</label>
            <select value={form.accountId} onChange={(e) => set('accountId', e.target.value)}
              className="input-base" required>
              <option value="">Selecciona una cuenta</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{iconEmoji(a.icon)} {a.name}</option>
              ))}
            </select>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Categoría <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
              {filteredCats.map((cat) => (
                <button key={cat.id} type="button" onClick={() => set('categoryId', form.categoryId === cat.id ? '' : cat.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center transition-all
                    ${form.categoryId === cat.id
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-[10px] text-gray-600 dark:text-gray-300 leading-tight truncate w-full text-center">{cat.name}</span>
                  {form.categoryId === cat.id && (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Descripción <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input value={form.description} onChange={(e) => set('description', e.target.value)}
              className="input-base" placeholder="Ej: Supermercado Wong, Sueldo enero..." />
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fecha</label>
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
              className="input-base" required />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Tags <span className="text-gray-400 font-normal">(separados por coma)</span>
            </label>
            <input value={form.tags} onChange={(e) => set('tags', e.target.value)}
              className="input-base" placeholder="Ej: familia, trabajo, urgente" />
            {form.tags && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                  <span key={tag} className="badge bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recurrencia — solo al crear */}
          {!initial && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
              <button type="button" onClick={() => setShowRec((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-violet-500" /> Transacción recurrente</span>
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-5 rounded-full transition-colors ${form.isRecurring ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-0.5 ${form.isRecurring ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showRec ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {showRec && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isRecurring} onChange={(e) => set('isRecurring', e.target.checked)}
                      className="w-4 h-4 accent-violet-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Activar recurrencia</span>
                  </label>
                  {form.isRecurring && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Frecuencia</label>
                        <select value={form.recurringRule.frequency} onChange={(e) => setRec('frequency', e.target.value)}
                          className="input-base text-sm py-2">
                          {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Próxima fecha</label>
                        <input type="date" value={form.recurringRule.nextDate} onChange={(e) => setRec('nextDate', e.target.value)}
                          className="input-base text-sm py-2" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Fecha fin <span className="text-gray-400">(opcional)</span></label>
                        <input type="date" value={form.recurringRule.endDate} onChange={(e) => setRec('endDate', e.target.value)}
                          className="input-base text-sm py-2" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pt-4 pb-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading}
            className={`flex-1 py-3 rounded-xl font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2
              ${isIngreso
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700'}`}>
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : initial ? 'Guardar cambios' : `Registrar ${isIngreso ? 'ingreso' : 'egreso'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
