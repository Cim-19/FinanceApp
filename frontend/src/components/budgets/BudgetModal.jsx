import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import useCategories from '../../hooks/useCategories';

const EMPTY = { categoryId: '', amount: '' };

export default function BudgetModal({ open, onClose, onSave, editing }) {
  const { expense, loading: loadCats } = useCategories();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err,  setErr ] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(editing
      ? { categoryId: editing.categoryId, amount: String(editing.amount) }
      : EMPTY
    );
    setErr('');
  }, [open, editing]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categoryId) { setErr('Selecciona una categoría'); return; }
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { setErr('Ingresa un monto válido'); return; }
    setBusy(true);
    setErr('');
    try {
      await onSave({ ...form, amount });
      onClose();
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Error al guardar');
    } finally {
      setBusy(false);
    }
  };

  const selected = expense.find((c) => c.id === form.categoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-lg text-gray-800 dark:text-white">
            {editing ? 'Editar presupuesto' : 'Nuevo presupuesto'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Category selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Categoría</label>
            {loadCats ? (
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ) : (
              <select
                className="input-base"
                value={form.categoryId}
                onChange={(e) => set('categoryId', e.target.value)}
                disabled={!!editing}
              >
                <option value="">Selecciona una categoría…</option>
                {expense.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Límite mensual</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">S/.</span>
              <input
                type="number"
                min="1"
                step="0.01"
                className="input-base pl-10 text-lg font-bold"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
              />
            </div>
          </div>

          {/* Preview */}
          {selected && form.amount && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 flex items-center gap-3">
              <span className="text-2xl">{selected.icon}</span>
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{selected.name}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Límite: S/. {parseFloat(form.amount || 0).toFixed(2)} / mes
                </p>
              </div>
            </div>
          )}

          {err && <p className="text-sm text-rose-500">{err}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={busy}
              className="btn-primary flex-1 disabled:opacity-50">
              {busy ? 'Guardando…' : editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
