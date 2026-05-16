import { useState } from 'react';
import {
  Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown,
  RefreshCw, ChevronLeft, ChevronRight, ArrowLeftRight,
} from 'lucide-react';

import useTransactions   from '../hooks/useTransactions';
import useCategories     from '../hooks/useCategories';
import useAccounts       from '../hooks/useAccounts';
import useRecurring      from '../hooks/useRecurring';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionModal   from '../components/transactions/TransactionModal';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import RecurringList      from '../components/recurring/RecurringList';
import TransferHistory    from '../components/transfers/TransferHistory';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate }     from '../utils/formatDate';
import { iconEmoji }      from '../utils/accountTypes';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SortIcon = ({ field, current, order }) => {
  if (current !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-300" />;
  return order === 'asc'
    ? <ArrowUp   className="w-3.5 h-3.5 text-violet-500" />
    : <ArrowDown className="w-3.5 h-3.5 text-violet-500" />;
};

const TypeBadge = ({ type }) =>
  type === 'INGRESO'
    ? <span className="badge bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Ingreso</span>
    : <span className="badge bg-rose-100    dark:bg-rose-900/30    text-rose-700    dark:text-rose-300   "><span className="w-1.5 h-1.5 rounded-full bg-rose-500    inline-block" /> Egreso</span>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const { transactions, meta, filters, loading, error, applyFilter, resetFilters, hasActiveFilters, create, update, remove } = useTransactions();
  const { categories }  = useCategories();
  const { accounts }    = useAccounts();
  const { rules: recurringRules, loading: recurringLoading, update: updateRecurring, remove: removeRecurring } = useRecurring();

  const [txModal,  setTxModal ] = useState({ open: false, initial: null });
  const [delModal, setDelModal] = useState({ open: false, tx: null, loading: false });

  const openCreate = ()   => setTxModal({ open: true, initial: null });
  const openEdit   = (tx) => setTxModal({ open: true, initial: tx  });

  const handleSave = async (payload) => {
    if (txModal.initial) await update(txModal.initial.id, payload);
    else                  await create(payload);
  };

  const handleDelete = async () => {
    setDelModal((d) => ({ ...d, loading: true }));
    try {
      await remove(delModal.tx.id);
      setDelModal({ open: false, tx: null, loading: false });
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
      setDelModal((d) => ({ ...d, loading: false }));
    }
  };

  const toggleSort = (field) => {
    if (filters.sortBy === field) {
      applyFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      applyFilter('sortBy', field);
      applyFilter('sortOrder', 'desc');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {meta.total} transacción{meta.total !== 1 ? 'es' : ''}
          </p>
        </div>
        <button onClick={openCreate}
          className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition shadow-sm">
          <Plus className="w-4 h-4" /> Nueva transacción
        </button>
      </div>

      {/* Recurrentes */}
      <RecurringList
        rules={recurringRules}
        loading={recurringLoading}
        onUpdate={updateRecurring}
        onRemove={removeRecurring}
      />

      {/* Historial de transferencias */}
      <TransferHistory accounts={accounts} />

      {/* Filtros */}
      <TransactionFilters
        filters={filters}
        onFilter={applyFilter}
        onReset={resetFilters}
        accounts={accounts}
        categories={categories}
        hasActive={hasActiveFilters}
      />

      {/* Tabla / Cards */}
      {loading ? (
        <TransactionsSkeleton />
      ) : error ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-4xl">😔</span>
          <p className="text-gray-500">{error}</p>
          <button onClick={() => applyFilter('page', 1)} className="btn-primary w-auto px-5 py-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} onReset={resetFilters} onCreate={openCreate} />
      ) : (
        <>
          {/* Tabla — desktop */}
          <div className="hidden lg:block card p-0 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  {[
                    { label: 'Fecha',       field: 'date'   },
                    { label: 'Descripción', field: null     },
                    { label: 'Categoría',   field: null     },
                    { label: 'Cuenta',      field: null     },
                    { label: 'Tipo',        field: null     },
                    { label: 'Monto',       field: 'amount' },
                    { label: '',            field: null     },
                  ].map(({ label, field }) => (
                    <th key={label}
                      onClick={() => field && toggleSort(field)}
                      className={`text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide
                        ${field ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none' : ''}`}>
                      <span className="flex items-center gap-1">
                        {label}
                        {field && <SortIcon field={field} current={filters.sortBy} order={filters.sortOrder} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(tx.date, { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                        {tx.description || <span className="text-gray-400 italic">Sin descripción</span>}
                      </p>
                      {tx.isTransfer && (
                        <span className="text-[10px] flex items-center gap-1 text-blue-500 mt-0.5">
                          <ArrowLeftRight className="w-3 h-3" /> Transferencia
                        </span>
                      )}
                      {tx.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {tx.tags.slice(0, 2).map((t) => (
                            <span key={t} className="badge bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] py-0">#{t}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {tx.category ? (
                        <span className="flex items-center gap-1.5 text-sm">
                          <span className="text-base">{tx.category.icon}</span>
                          <span className="text-gray-600 dark:text-gray-300">{tx.category.name}</span>
                        </span>
                      ) : <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                        <span>{iconEmoji(tx.account?.icon)}</span>
                        <span className="truncate max-w-[100px]">{tx.account?.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={tx.type} /></td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-bold ${tx.type === 'INGRESO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {tx.type === 'INGRESO' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        {!tx.isTransfer && (
                          <button onClick={() => openEdit(tx)}
                            className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => setDelModal({ open: true, tx, loading: false })}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile */}
          <div className="lg:hidden space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="card p-4 flex items-center gap-3">
                {/* Ícono categoría */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0
                  ${tx.type === 'INGRESO' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
                  {tx.category?.icon || (tx.isTransfer ? '💸' : '📦')}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                    {tx.description || tx.category?.name || 'Sin descripción'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{formatDate(tx.date, { day: '2-digit', month: 'short' })}</span>
                    {tx.account && <span className="text-xs text-gray-400">· {tx.account.name}</span>}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${tx.type === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'INGRESO' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  {!tx.isTransfer && (
                    <div className="flex gap-1 justify-end mt-1">
                      <button onClick={() => openEdit(tx)} className="p-1 text-gray-400 hover:text-violet-600 rounded-lg transition">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDelModal({ open: true, tx, loading: false })} className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {meta.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Página {meta.page} de {meta.pages} · {meta.total} total
              </p>
              <div className="flex gap-2">
                <button onClick={() => applyFilter('page', meta.page - 1)} disabled={meta.page === 1}
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(meta.pages, 5) }, (_, i) => {
                  const page = meta.pages <= 5 ? i + 1 : Math.max(1, meta.page - 2) + i;
                  if (page > meta.pages) return null;
                  return (
                    <button key={page} onClick={() => applyFilter('page', page)}
                      className={`w-9 h-9 rounded-xl text-sm font-medium transition
                        ${meta.page === page
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                          : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                      {page}
                    </button>
                  );
                })}
                <button onClick={() => applyFilter('page', meta.page + 1)} disabled={meta.page === meta.pages}
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* FAB mobile */}
      <button onClick={openCreate}
        className="lg:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl shadow-float flex items-center justify-center">
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Modales */}
      <TransactionModal
        open={txModal.open}
        initial={txModal.initial}
        onClose={() => setTxModal({ open: false, initial: null })}
        onSave={handleSave}
        accounts={accounts}
        categories={categories}
      />

      <DeleteConfirmModal
        open={delModal.open}
        loading={delModal.loading}
        title="¿Eliminar transacción?"
        description="Esta acción revertirá el saldo de la cuenta y no se puede deshacer."
        onClose={() => setDelModal({ open: false, tx: null, loading: false })}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function EmptyState({ hasFilters, onReset, onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center mb-4">
        <span className="text-4xl">{hasFilters ? '🔍' : '💸'}</span>
      </div>
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
        {hasFilters ? 'Sin resultados' : 'Sin transacciones'}
      </h3>
      <p className="text-gray-400 dark:text-gray-500 text-sm mb-5">
        {hasFilters ? 'Prueba con otros filtros' : 'Registra tu primer ingreso o egreso'}
      </p>
      {hasFilters
        ? <button onClick={onReset} className="btn-secondary w-auto px-5 py-2 text-sm">Limpiar filtros</button>
        : <button onClick={onCreate} className="btn-primary w-auto px-6 py-2.5"><Plus className="w-4 h-4" /> Nueva transacción</button>}
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="card p-0 overflow-hidden animate-pulse">
      <div className="h-10 bg-gray-100 dark:bg-gray-800" />
      {[1,2,3,4,5].map((i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-t border-gray-50 dark:border-gray-800">
          <div className="w-16 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="w-20 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="w-24 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="w-16 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}
