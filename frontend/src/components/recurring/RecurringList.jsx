import { useState } from 'react';
import { RefreshCw, Trash2, ChevronDown, ChevronUp, Pencil, X, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate }     from '../../utils/formatDate';

const FREQ_LABEL = { DAILY: 'Diario', WEEKLY: 'Semanal', MONTHLY: 'Mensual', YEARLY: 'Anual' };
const FREQ_ICON  = { DAILY: '📅', WEEKLY: '🗓️', MONTHLY: '📆', YEARLY: '🎯' };

const FREQUENCIES = [
  { value: 'DAILY',   label: 'Diario'   },
  { value: 'WEEKLY',  label: 'Semanal'  },
  { value: 'MONTHLY', label: 'Mensual'  },
  { value: 'YEARLY',  label: 'Anual'    },
];

function EditForm({ rule, onSave, onCancel }) {
  const [frequency, setFrequency] = useState(rule.frequency);
  const [endDate,   setEndDate  ] = useState(rule.endDate ? rule.endDate.split('T')[0] : '');
  const [saving,    setSaving   ] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(rule.id, { frequency, endDate: endDate || null });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Frecuencia</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)}
            className="input-base text-sm py-2">
            {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha fin <span className="text-gray-400">(opcional)</span></label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="input-base text-sm py-2" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition">
          <X className="w-3.5 h-3.5" /> Cancelar
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition disabled:opacity-60">
          {saving
            ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Check className="w-3.5 h-3.5" />}
          Guardar
        </button>
      </div>
    </div>
  );
}

function RuleCard({ rule, onUpdate, onRemove }) {
  const [editing,  setEditing ] = useState(false);
  const [removing, setRemoving] = useState(false);
  const tx = rule.transaction;

  const handleRemove = async () => {
    if (!confirm('¿Cancelar esta recurrencia? Las transacciones ya generadas no se eliminarán.')) return;
    setRemoving(true);
    try { await onRemove(rule.id); } finally { setRemoving(false); }
  };

  const handleSave = async (id, data) => {
    await onUpdate(id, data);
    setEditing(false);
  };

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        {/* Ícono */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0
          ${tx.type === 'INGRESO' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
          {tx.category?.icon || '🔄'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
              {tx.description || tx.category?.name || 'Sin descripción'}
            </p>
            <span className={`text-sm font-bold flex-shrink-0 ${tx.type === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {tx.type === 'INGRESO' ? '+' : '-'}{formatCurrency(tx.amount)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              {FREQ_ICON[rule.frequency]} {FREQ_LABEL[rule.frequency]}
            </span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Próxima: <span className="font-medium text-gray-700 dark:text-gray-300">
                {formatDate(rule.nextDate, { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </span>
            {rule.endDate && (
              <>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Fin: {formatDate(rule.endDate, { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </>
            )}
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{tx.account?.name}</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => setEditing((v) => !v)}
            className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition">
            {editing ? <ChevronUp className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </button>
          <button onClick={handleRemove} disabled={removing}
            className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition disabled:opacity-60">
            {removing
              ? <span className="w-4 h-4 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin block" />
              : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {editing && (
        <EditForm rule={rule} onSave={handleSave} onCancel={() => setEditing(false)} />
      )}
    </div>
  );
}

export default function RecurringList({ rules, loading, onUpdate, onRemove }) {
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="card p-4 flex items-center gap-3 animate-pulse">
        <RefreshCw className="w-5 h-5 text-gray-300" />
        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-40" />
      </div>
    );
  }

  return (
    <div className="border border-violet-200 dark:border-violet-800 rounded-2xl overflow-hidden bg-violet-50/50 dark:bg-violet-900/10">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition">
        <span className="flex items-center gap-2.5 text-sm font-semibold text-violet-700 dark:text-violet-400">
          <RefreshCw className="w-4 h-4" />
          Transacciones recurrentes
          {rules.length > 0 && (
            <span className="bg-violet-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {rules.length}
            </span>
          )}
        </span>
        {open
          ? <ChevronUp   className="w-4 h-4 text-violet-500" />
          : <ChevronDown className="w-4 h-4 text-violet-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-violet-200 dark:border-violet-800 pt-3">
          {rules.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">🔄</p>
              <p className="text-sm text-gray-400">No tienes transacciones recurrentes</p>
              <p className="text-xs text-gray-400 mt-1">Activa la opción al crear una nueva transacción</p>
            </div>
          ) : (
            rules.map((rule) => (
              <RuleCard key={rule.id} rule={rule} onUpdate={onUpdate} onRemove={onRemove} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
