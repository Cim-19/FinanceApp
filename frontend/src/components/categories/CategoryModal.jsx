import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const EMOJIS = [
  '🛒','🍔','🍕','☕','🏠','🚗','⚡','📱','🎬','🎮',
  '👗','💊','📚','✈️','🏋️','🐾','🎵','💰','🎁','🏥',
  '🌿','🍺','🎓','🔧','💅','🏦','📺','🧴','🎯','🌟',
];

const COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316',
  '#eab308','#22c55e','#14b8a6','#06b6d4','#3b82f6',
  '#64748b','#78716c',
];

const TYPE_OPTS = [
  { value: 'EGRESO',  label: 'Gasto',   color: 'text-rose-600   bg-rose-50   dark:bg-rose-900/20   border-rose-200   dark:border-rose-800'   },
  { value: 'INGRESO', label: 'Ingreso', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  { value: 'AMBOS',   label: 'Ambos',   color: 'text-violet-600  bg-violet-50  dark:bg-violet-900/20  border-violet-200  dark:border-violet-800'  },
];

const EMPTY = { name: '', icon: '🛒', color: '#6366f1', type: 'EGRESO' };

export default function CategoryModal({ open, onClose, onSave, editing }) {
  const [form, setForm]   = useState(EMPTY);
  const [busy, setBusy]   = useState(false);
  const [err,  setErr ]   = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(editing
      ? { name: editing.name, icon: editing.icon || '🛒', color: editing.color || '#6366f1', type: editing.type }
      : EMPTY
    );
    setErr('');
  }, [open, editing]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErr('El nombre es requerido'); return; }
    setBusy(true);
    setErr('');
    try {
      await onSave(form);
      onClose();
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Error al guardar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in overflow-y-auto max-h-[88svh] sm:max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-lg text-gray-800 dark:text-white">
            {editing ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Preview */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md flex-shrink-0"
              style={{ backgroundColor: form.color + '22', border: `2px solid ${form.color}40` }}>
              {form.icon}
            </div>
            <div>
              <p className="font-bold text-gray-800 dark:text-white text-base">
                {form.name || 'Nombre categoría'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {TYPE_OPTS.find((t) => t.value === form.type)?.label}
              </p>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre</label>
            <input
              className="input-base"
              placeholder="Ej. Comida, Transporte…"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              maxLength={40}
              autoFocus
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTS.map((t) => (
                <button key={t.value} type="button"
                  onClick={() => set('type', t.value)}
                  className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                    form.type === t.value ? t.color : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Emoji */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ícono</label>
            <div className="grid grid-cols-10 gap-1.5">
              {EMOJIS.map((em) => (
                <button key={em} type="button"
                  onClick={() => set('icon', em)}
                  className={`h-9 w-9 flex items-center justify-center rounded-xl text-lg transition-all ${
                    form.icon === em
                      ? 'ring-2 ring-violet-500 bg-violet-50 dark:bg-violet-900/30 scale-110'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}>
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button"
                  onClick={() => set('color', c)}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full transition-all ${
                    form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          {err && <p className="text-sm text-rose-500">{err}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={busy}
              className="btn-primary flex-1 disabled:opacity-50">
              {busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
