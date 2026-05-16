import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, RefreshCw, Calendar, Filter } from 'lucide-react';
import { listTransfers } from '../../api/transfers';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate }     from '../../utils/formatDate';
import { iconEmoji }      from '../../utils/accountTypes';

export default function TransferHistory({ accounts }) {
  const [open,      setOpen     ] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [meta,      setMeta     ] = useState(null);
  const [loading,   setLoading  ] = useState(false);
  const [page,      setPage     ] = useState(1);
  const [filters,   setFilters  ] = useState({ desde: '', hasta: '', accountId: '' });

  const load = useCallback(async (p = 1, f = filters) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 10, ...f };
      if (!params.desde)     delete params.desde;
      if (!params.hasta)     delete params.hasta;
      if (!params.accountId) delete params.accountId;
      const { data } = await listTransfers(params);
      setTransfers(data.data.transfers);
      setMeta(data.data.meta);
      setPage(p);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (open && transfers.length === 0) load(1);
  }, [open]);

  const applyFilters = () => load(1, filters);
  const resetFilters = () => {
    const clean = { desde: '', hasta: '', accountId: '' };
    setFilters(clean);
    load(1, clean);
  };

  const hasFilters = filters.desde || filters.hasta || filters.accountId;

  return (
    <div className="card overflow-hidden">
      {/* Header colapsable */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-800 dark:text-white text-sm">Historial de transferencias</p>
            {meta && (
              <p className="text-xs text-gray-400">{meta.total} transferencia{meta.total !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <span className="w-2 h-2 rounded-full bg-violet-500" />
          )}
          {open
            ? <ChevronUp   className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-4">

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 w-full mb-1">
              <Filter className="w-3.5 h-3.5" /> Filtrar
            </div>
            <input
              type="date"
              value={filters.desde}
              onChange={(e) => setFilters((f) => ({ ...f, desde: e.target.value }))}
              className="input text-xs py-1.5 flex-1 min-w-[130px]"
              placeholder="Desde"
            />
            <input
              type="date"
              value={filters.hasta}
              onChange={(e) => setFilters((f) => ({ ...f, hasta: e.target.value }))}
              className="input text-xs py-1.5 flex-1 min-w-[130px]"
              placeholder="Hasta"
            />
            <select
              value={filters.accountId}
              onChange={(e) => setFilters((f) => ({ ...f, accountId: e.target.value }))}
              className="input text-xs py-1.5 flex-1 min-w-[150px]"
            >
              <option value="">Todas las cuentas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{iconEmoji(a.icon)} {a.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={applyFilters} className="btn-primary text-xs px-3 py-1.5">Aplicar</button>
              {hasFilters && (
                <button onClick={resetFilters} className="btn-secondary text-xs px-3 py-1.5">Limpiar</button>
              )}
            </div>
          </div>

          {/* Lista */}
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />
              ))}
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <span className="text-3xl block mb-2">💸</span>
              <p className="text-sm">Sin transferencias{hasFilters ? ' con estos filtros' : ' registradas'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transfers.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">

                  {/* Cuenta origen */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center text-base flex-shrink-0">
                      {iconEmoji(t.account?.icon)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                        {t.account?.name ?? '—'}
                      </p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(t.date, { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>

                  {/* Flecha + monto */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-7 h-7 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-gray-800 dark:text-white mt-0.5">
                      {formatCurrency(t.amount)}
                    </span>
                  </div>

                  {/* Cuenta destino */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                    <div className="min-w-0 text-right">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                        {t.toAccount?.name ?? '—'}
                      </p>
                      <p className="text-[10px] text-gray-400">Destino</p>
                    </div>
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-base flex-shrink-0">
                      {t.toAccount ? iconEmoji(t.toAccount.icon) : '?'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-400">
                Página {meta.page} de {meta.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={meta.page <= 1 || loading}
                  onClick={() => load(meta.page - 1)}
                  className="p-1.5 text-gray-400 hover:text-violet-600 disabled:opacity-30 rounded-lg transition"
                >
                  ←
                </button>
                <button
                  disabled={meta.page >= meta.totalPages || loading}
                  onClick={() => load(meta.page + 1)}
                  className="p-1.5 text-gray-400 hover:text-violet-600 disabled:opacity-30 rounded-lg transition"
                >
                  →
                </button>
              </div>
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={() => load(page)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-violet-600 py-1 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      )}
    </div>
  );
}
