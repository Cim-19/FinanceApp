import { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { ACCOUNT_TYPES, iconEmoji } from '../../utils/accountTypes';
import { formatCurrency } from '../../utils/formatCurrency';

export default function TransferModal({ open, onClose, onSave, accounts, defaultFrom }) {
  const [form,    setForm   ] = useState({ fromAccountId: defaultFrom?.id || '', toAccountId: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const fromAccount = accounts.find((a) => a.id === form.fromAccountId);
  const toAccount   = accounts.find((a) => a.id === form.toAccountId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.fromAccountId === form.toAccountId) {
      setError('Las cuentas deben ser diferentes');
      return;
    }
    if (Number(form.amount) <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSave({
        fromAccountId: form.fromAccountId,
        toAccountId:   form.toAccountId,
        amount:        Number(form.amount),
        description:   form.description || undefined,
        date:          form.date,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al realizar la transferencia');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const insufficientFunds = fromAccount && Number(form.amount) > 0 && Number(form.amount) > Number(fromAccount.balance);

  const AccountOption = ({ account }) => {
    const meta = ACCOUNT_TYPES[account.type];
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg">{iconEmoji(account.icon)}</span>
        <div>
          <p className="text-sm font-medium">{account.name}</p>
          <p className="text-xs text-gray-400">{formatCurrency(account.balance)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">💸 Transferencia</h2>
            <p className="text-xs text-gray-400 mt-0.5">Mueve dinero entre tus cuentas</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">⚠️ {error}</div>
          )}

          {/* Visualización origen → destino */}
          {(fromAccount || toAccount) && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex-1 text-center">
                {fromAccount
                  ? <><p className="text-lg">{iconEmoji(fromAccount.icon)}</p><p className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">{fromAccount.name}</p></>
                  : <p className="text-xs text-gray-400">Origen</p>}
              </div>
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-center">
                {toAccount
                  ? <><p className="text-lg">{iconEmoji(toAccount.icon)}</p><p className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">{toAccount.name}</p></>
                  : <p className="text-xs text-gray-400">Destino</p>}
              </div>
            </div>
          )}

          {/* Cuenta origen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cuenta origen</label>
            <select value={form.fromAccountId} onChange={(e) => set('fromAccountId', e.target.value)}
              className="input-base" required>
              <option value="">Selecciona una cuenta</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id} disabled={a.id === form.toAccountId}>
                  {iconEmoji(a.icon)} {a.name} — {formatCurrency(a.balance)}
                </option>
              ))}
            </select>
          </div>

          {/* Cuenta destino */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cuenta destino</label>
            <select value={form.toAccountId} onChange={(e) => set('toAccountId', e.target.value)}
              className="input-base" required>
              <option value="">Selecciona una cuenta</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id} disabled={a.id === form.fromAccountId}>
                  {iconEmoji(a.icon)} {a.name} — {formatCurrency(a.balance)}
                </option>
              ))}
            </select>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Monto</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">S/.</span>
              <input type="number" min="0.01" step="0.01" value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                className={`input-base pl-10 ${insufficientFunds ? 'border-rose-400 focus:ring-rose-400' : ''}`}
                placeholder="0.00" required />
            </div>
            {insufficientFunds && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                ⚠️ Saldo insuficiente — disponible: {formatCurrency(fromAccount.balance)}
              </p>
            )}
            {fromAccount && Number(form.amount) === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Saldo disponible: {formatCurrency(fromAccount.balance)}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input value={form.description} onChange={(e) => set('description', e.target.value)}
              className="input-base" placeholder="Ej: Ahorro mensual..." />
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fecha</label>
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
              className="input-base" required />
          </div>
        </form>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : '💸 Transferir'}
          </button>
        </div>
      </div>
    </div>
  );
}
