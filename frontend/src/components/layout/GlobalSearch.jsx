import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { globalSearch } from '../../api/search';
import { formatCurrency } from '../../utils/formatCurrency';
import { iconEmoji } from '../../utils/accountTypes';

const TYPE_LABEL = { INGRESO: 'Ingreso', EGRESO: 'Egreso' };
const TYPE_COLOR = {
  INGRESO: 'text-emerald-600 dark:text-emerald-400',
  EGRESO:  'text-rose-600 dark:text-rose-400',
};

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function GlobalSearch() {
  const navigate  = useNavigate();
  const inputRef  = useRef(null);
  const listRef   = useRef(null);

  const [query,   setQuery  ] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen   ] = useState(false);
  const [cursor,  setCursor ] = useState(-1);

  const debouncedQuery = useDebounce(query, 280);

  // Construye lista plana de items navegables
  const items = results ? [
    ...results.transactions.map((t) => ({ type: 'tx',  data: t })),
    ...results.accounts.map((a)    => ({ type: 'acc', data: a })),
    ...results.categories.map((c)  => ({ type: 'cat', data: c })),
  ] : [];

  const total = results
    ? results.transactions.length + results.accounts.length + results.categories.length
    : 0;

  // Fetch
  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults(null); setOpen(false); return; }
    let cancelled = false;
    setLoading(true);
    globalSearch(debouncedQuery)
      .then(({ data }) => {
        if (!cancelled) { setResults(data.data); setOpen(true); setCursor(-1); }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Ctrl+K / Cmd+K para abrir
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Click fuera cierra
  useEffect(() => {
    const handler = (e) => {
      if (!listRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navigate_to = useCallback((item) => {
    setOpen(false);
    setQuery('');
    setResults(null);
    if (item.type === 'tx')  return navigate('/transactions');
    if (item.type === 'acc') return navigate('/accounts');
    if (item.type === 'cat') return navigate('/categories');
  }, [navigate]);

  const handleKeyDown = (e) => {
    if (!open || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter' && cursor >= 0) {
      e.preventDefault();
      navigate_to(items[cursor]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const clear = () => { setQuery(''); setResults(null); setOpen(false); inputRef.current?.focus(); };

  return (
    <div className="relative flex-1 max-w-sm">
      {/* Input */}
      <div className="relative flex items-center">
        <Search className={`absolute left-3 w-4 h-4 pointer-events-none transition-colors ${open ? 'text-violet-500' : 'text-gray-400'}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results && total > 0) setOpen(true); }}
          placeholder="Buscar… (Ctrl+K)"
          className="w-full pl-9 pr-16 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700
                     bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent
                     focus:bg-white dark:focus:bg-gray-750 transition"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {loading && (
            <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          )}
          {query && !loading && (
            <button onClick={clear} className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {!query && (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in"
        >
          {total === 0 ? (
            <div className="px-4 py-6 text-center">
              <span className="text-2xl block mb-1">🔍</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sin resultados para <span className="font-semibold">&quot;{query}&quot;</span></p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto py-1.5">

              {/* Transacciones */}
              {results.transactions.length > 0 && (
                <Section label="Transacciones">
                  {results.transactions.map((t, i) => {
                    const idx = i;
                    return (
                      <ResultItem
                        key={t.id}
                        active={cursor === idx}
                        onClick={() => navigate_to({ type: 'tx', data: t })}
                        onMouseEnter={() => setCursor(idx)}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0
                          ${t.type === 'INGRESO' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
                          {t.category?.icon || '💸'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                            {t.description || t.category?.name || 'Sin descripción'}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {t.account?.name} · {t.category?.name}
                          </p>
                        </div>
                        <span className={`text-sm font-bold flex-shrink-0 ${TYPE_COLOR[t.type]}`}>
                          {t.type === 'INGRESO' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </ResultItem>
                    );
                  })}
                </Section>
              )}

              {/* Cuentas */}
              {results.accounts.length > 0 && (
                <Section label="Cuentas">
                  {results.accounts.map((a, i) => {
                    const idx = results.transactions.length + i;
                    return (
                      <ResultItem
                        key={a.id}
                        active={cursor === idx}
                        onClick={() => navigate_to({ type: 'acc', data: a })}
                        onMouseEnter={() => setCursor(idx)}
                      >
                        <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                          {iconEmoji(a.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{a.name}</p>
                          <p className="text-xs text-gray-400">{a.type}</p>
                        </div>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200 flex-shrink-0">
                          {formatCurrency(a.balance)}
                        </span>
                      </ResultItem>
                    );
                  })}
                </Section>
              )}

              {/* Categorías */}
              {results.categories.length > 0 && (
                <Section label="Categorías">
                  {results.categories.map((c, i) => {
                    const idx = results.transactions.length + results.accounts.length + i;
                    return (
                      <ResultItem
                        key={c.id}
                        active={cursor === idx}
                        onClick={() => navigate_to({ type: 'cat', data: c })}
                        onMouseEnter={() => setCursor(idx)}
                      >
                        <div className="w-8 h-8 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                          {c.icon || '🏷️'}
                        </div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white flex-1 min-w-0 truncate">{c.name}</p>
                        {c.isSystem && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded flex-shrink-0">Sistema</span>
                        )}
                      </ResultItem>
                    );
                  })}
                </Section>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-2 flex items-center gap-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1"><ArrowUpDown className="w-3 h-3" /> Navegar</span>
            <span><kbd className="font-mono">Enter</kbd> Ir</span>
            <span><kbd className="font-mono">Esc</kbd> Cerrar</span>
            {total > 0 && <span className="ml-auto">{total} resultado{total !== 1 ? 's' : ''}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div>
      <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
        {label}
      </p>
      {children}
    </div>
  );
}

function ResultItem({ active, onClick, onMouseEnter, children }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
        ${active
          ? 'bg-violet-50 dark:bg-violet-900/20'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
    >
      {children}
    </button>
  );
}
