import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, AlertTriangle } from 'lucide-react';
import useBudgets         from '../hooks/useBudgets';
import BudgetCard         from '../components/budgets/BudgetCard';
import BudgetModal        from '../components/budgets/BudgetModal';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import { formatCurrency } from '../utils/formatCurrency';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function BudgetsPage() {
  const now  = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear ] = useState(now.getFullYear());

  const { budgets, totalBudgeted, totalSpent, loading, create, update, remove } = useBudgets(month, year);

  const [modal,     setModal    ] = useState(false);
  const [editing,   setEditing  ] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [delBusy,   setDelBusy  ] = useState(false);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
    if (isCurrentMonth) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };
  const isCurrent = month === now.getMonth() + 1 && year === now.getFullYear();

  const openCreate = ()    => { setEditing(null); setModal(true); };
  const openEdit   = (b)   => { setEditing(b);    setModal(true); };

  const handleSave = async (form) => {
    if (editing) await update(editing.id, form);
    else         await create(form);
  };

  const handleDelete = async () => {
    setDelBusy(true);
    try { await remove(delTarget.id); setDelTarget(null); }
    finally { setDelBusy(false); }
  };

  const overBudget  = budgets.filter((b) => Number(b.spent || 0) > Number(b.amount));
  const totalPct    = totalBudgeted > 0 ? Math.min((totalSpent / totalBudgeted) * 100, 100) : 0;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white">Presupuestos</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Controla tus gastos mes a mes
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Nuevo presupuesto
        </button>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={prevMonth}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <span className="text-lg font-bold text-gray-800 dark:text-white w-44 text-center">
          {MONTHS[month - 1]} {year}
        </span>
        <button onClick={nextMonth} disabled={isCurrent}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Summary card */}
      {!loading && budgets.length > 0 && (
        <div className="card bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">Total presupuestado</p>
              <p className="text-2xl font-extrabold text-amber-800 dark:text-amber-200">{formatCurrency(totalBudgeted)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">Total gastado</p>
              <p className={`text-2xl font-extrabold ${totalSpent > totalBudgeted ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatCurrency(totalSpent)}
              </p>
            </div>
          </div>

          <div className="h-3 bg-amber-100 dark:bg-amber-900/40 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                totalSpent > totalBudgeted ? 'bg-rose-500' : totalPct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${totalPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {totalPct.toFixed(0)}% utilizado
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400">
              Restante: {formatCurrency(Math.max(totalBudgeted - totalSpent, 0))}
            </span>
          </div>

          {overBudget.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {overBudget.length === 1
                ? `1 categoría ha superado su límite`
                : `${overBudget.length} categorías han superado su límite`}
            </div>
          )}
        </div>
      )}

      {/* Budget grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">🎯</span>
          <p className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Sin presupuestos</p>
          <p className="text-gray-400 mb-6 max-w-xs mx-auto">
            Crea un presupuesto por categoría para controlar tus gastos este mes.
          </p>
          <button onClick={openCreate} className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> Crear primer presupuesto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <BudgetCard key={b.id} budget={b} onEdit={openEdit} onDelete={setDelTarget} />
          ))}
        </div>
      )}

      <BudgetModal
        open={modal}
        onClose={() => setModal(false)}
        onSave={handleSave}
        editing={editing}
      />

      <DeleteConfirmModal
        open={!!delTarget}
        title="¿Eliminar presupuesto?"
        description={`Se eliminará el presupuesto para "${delTarget?.category?.name}".`}
        busy={delBusy}
        onConfirm={handleDelete}
        onClose={() => setDelTarget(null)}
      />
    </div>
  );
}
