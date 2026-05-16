import { useState } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';

const TYPE_OPTS = [
  { value: '',       label: 'Todos',    emoji: '📋' },
  { value: 'INGRESO', label: 'Ingresos', emoji: '🟢' },
  { value: 'EGRESO',  label: 'Egresos',  emoji: '🔴' },
];

export default function TransactionFilters({ filters, onFilter, onReset, accounts, categories, hasActive }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700 overflow-hidden">

      {/* Fila principal */}
      <div className="flex items-center gap-2 p-3">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={filters.search}
            onChange={(e) => onFilter('search', e.target.value)}
            placeholder="Buscar transacción..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
          />
        </div>

        {/* Toggle filtros avanzados */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition
            ${hasActive
              ? 'bg-violet-600 text-white border-violet-600'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filtros</span>
          {hasActive && <span className="w-2 h-2 bg-white rounded-full" />}
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {hasActive && (
          <button onClick={onReset}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition" title="Limpiar filtros">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Pills de tipo — siempre visibles */}
      <div className="flex gap-2 px-3 pb-3">
        {TYPE_OPTS.map((t) => (
          <button key={t.value} onClick={() => onFilter('type', t.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
              ${filters.type === t.value
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            <span>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filtros avanzados */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 p-3 grid grid-cols-2 md:grid-cols-4 gap-3">

          {/* Cuenta */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cuenta</label>
            <select value={filters.accountId} onChange={(e) => onFilter('accountId', e.target.value)}
              className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400">
              <option value="">Todas</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Categoría</label>
            <select value={filters.categoryId} onChange={(e) => onFilter('categoryId', e.target.value)}
              className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400">
              <option value="">Todas</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          {/* Desde */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Desde</label>
            <input type="date" value={filters.desde} onChange={(e) => onFilter('desde', e.target.value)}
              className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>

          {/* Hasta */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Hasta</label>
            <input type="date" value={filters.hasta} onChange={(e) => onFilter('hasta', e.target.value)}
              className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
        </div>
      )}
    </div>
  );
}
