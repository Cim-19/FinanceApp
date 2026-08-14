import { useState } from 'react';
import { Plus, RefreshCw, Wallet, WalletCards, PiggyBank, TrendingUp, CreditCard } from 'lucide-react';

import useAccounts         from '../hooks/useAccounts';
import AccountCard         from '../components/accounts/AccountCard';
import AccountModal        from '../components/accounts/AccountModal';
import SavingGoalModal     from '../components/accounts/SavingGoalModal';
import TransferModal       from '../components/accounts/TransferModal';
import DeleteConfirmModal  from '../components/ui/DeleteConfirmModal';
import { formatCurrency }  from '../utils/formatCurrency';
import { ACCOUNT_TYPES }   from '../utils/accountTypes';

const SECTIONS = [
  { type: 'CORRIENTE', icon: Wallet,     title: 'Cuentas corrientes' },
  { type: 'INVERSION', icon: TrendingUp, title: 'Inversiones'        },
  { type: 'CREDITO',   icon: CreditCard, title: 'Tarjetas de crédito'},
];

export default function AccountsPage() {
  const { byType, accounts, totalBalance, loading, error, fetch, create, update, remove, transfer, updateGoal, removeGoal } = useAccounts();

  const [accountModal,  setAccountModal ] = useState({ open: false, initial: null });
  const [goalModal,     setGoalModal    ] = useState({ open: false, account: null });
  const [transferModal, setTransferModal] = useState({ open: false, defaultFrom: null });
  const [deleteModal,   setDeleteModal  ] = useState({ open: false, account: null, loading: false, error: '' });

  const openCreate   = ()        => setAccountModal({ open: true,  initial: null });
  const openEdit     = (account) => setAccountModal({ open: true,  initial: account });
  const openGoal     = (account) => setGoalModal({ open: true, account });
  const openTransfer = (account) => setTransferModal({ open: true, defaultFrom: account });

  const handleSave = async (payload) => {
    if (accountModal.initial) await update(accountModal.initial.id, payload);
    else                       await create(payload);
  };

  const handleDelete = async () => {
    setDeleteModal((d) => ({ ...d, loading: true, error: '' }));
    try {
      await remove(deleteModal.account.id);
      setDeleteModal({ open: false, account: null, loading: false, error: '' });
    } catch (err) {
      setDeleteModal((d) => ({ ...d, loading: false, error: err.response?.data?.error || 'Error al eliminar' }));
    }
  };

  if (loading) return <AccountsSkeleton />;

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <span className="text-4xl">😔</span>
      <p className="text-gray-500 dark:text-gray-400">{error}</p>
      <button onClick={fetch} className="btn-primary w-auto px-6 py-2.5 text-sm">
        <RefreshCw className="w-4 h-4" /> Reintentar
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header con balance total */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden shadow-lg shadow-violet-600/20">
        <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute right-12 bottom-0 w-28 h-28 bg-white/5 rounded-full translate-y-10" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-purple-200 text-sm font-medium">
                <WalletCards className="w-4 h-4 flex-shrink-0" />
                <span>Balance total consolidado</span>
              </div>
              <p className="text-[28px] sm:text-3xl font-extrabold tracking-tight mt-1 truncate">
                {formatCurrency(totalBalance)}
              </p>
            </div>
            <button onClick={openCreate}
              className="inline-flex items-center gap-2 self-start sm:self-auto flex-shrink-0 bg-white/20 hover:bg-white/30 active:scale-[0.98] backdrop-blur px-4 py-2.5 rounded-xl text-sm font-semibold transition">
              <Plus className="w-4 h-4" /> Nueva cuenta
            </button>
          </div>
          {/* Mini stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {Object.entries(ACCOUNT_TYPES).map(([type, meta]) => {
              const total = (byType[type] || []).reduce((s, a) => s + Math.round(Number(a.balance) * 100), 0) / 100;
              return (
                <div key={type} className="bg-white/10 hover:bg-white/[0.14] transition-colors rounded-xl p-3 text-center min-w-0">
                  <p className="text-lg leading-none">{meta.emoji}</p>
                  <p className="text-white/70 text-[11px] font-medium mt-1.5 truncate">{meta.label}</p>
                  <p className="text-white text-xs sm:text-sm font-bold mt-0.5 truncate">{formatCurrency(total)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sección Mis Ahorros 🐷 */}
      {byType.AHORRO.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <PiggyBank className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-bold text-gray-800 dark:text-white">Mis Ahorros 🐷</h2>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
              {byType.AHORRO.length} cuenta{byType.AHORRO.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {byType.AHORRO.map((account) => (
              <AccountCard key={account.id} account={account}
                onEdit={openEdit} onDelete={(a) => setDeleteModal({ open: true, account: a, loading: false, error: '' })}
                onTransfer={openTransfer} onGoal={openGoal} />
            ))}
          </div>
        </section>
      )}

      {/* Otras secciones */}
      {SECTIONS.map(({ type, icon: Icon, title }) =>
        byType[type].length > 0 ? (
          <section key={type}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-7 h-7 bg-gradient-to-br ${ACCOUNT_TYPES[type].gradient} rounded-lg flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-base font-bold text-gray-800 dark:text-white">{title}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACCOUNT_TYPES[type].badge}`}>
                {byType[type].length} cuenta{byType[type].length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {byType[type].map((account) => (
                <AccountCard key={account.id} account={account}
                  onEdit={openEdit} onDelete={(a) => setDeleteModal({ open: true, account: a, loading: false, error: '' })}
                  onTransfer={openTransfer} />
              ))}
            </div>
          </section>
        ) : null
      )}

      {/* Empty state */}
      {accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center mb-4">
            <span className="text-4xl">🏦</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Sin cuentas todavía</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-5">Agrega tu primera cuenta para empezar</p>
          <button onClick={openCreate} className="btn-primary w-auto px-6 py-2.5">
            <Plus className="w-4 h-4" /> Crear primera cuenta
          </button>
        </div>
      )}

      {/* FAB mobile */}
      <button onClick={openCreate}
        className="lg:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl shadow-float flex items-center justify-center">
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Modales */}
      <AccountModal
        open={accountModal.open}
        initial={accountModal.initial}
        onClose={() => setAccountModal({ open: false, initial: null })}
        onSave={handleSave}
      />

      <TransferModal
        open={transferModal.open}
        defaultFrom={transferModal.defaultFrom}
        accounts={accounts}
        onClose={() => setTransferModal({ open: false, defaultFrom: null })}
        onSave={transfer}
      />

      <SavingGoalModal
        open={goalModal.open}
        account={goalModal.account}
        onClose={() => setGoalModal({ open: false, account: null })}
        onSave={updateGoal}
        onDelete={removeGoal}
      />

      <DeleteConfirmModal
        open={deleteModal.open}
        loading={deleteModal.loading}
        error={deleteModal.error}
        title="¿Eliminar cuenta?"
        description={`Se eliminará "${deleteModal.account?.name}" y todas sus transacciones. Esta acción no se puede deshacer.`}
        onClose={() => setDeleteModal({ open: false, account: null, loading: false, error: '' })}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function AccountsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-36 bg-gray-200 dark:bg-gray-700 rounded-3xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl" />)}
      </div>
    </div>
  );
}
