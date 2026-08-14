import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Lock, Sparkles, TrendingUp, TrendingDown, RefreshCw, FileSpreadsheet, FileText } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

import {
  getMonthlyReport, getByCategoryReport,
  getBalanceEvolution, exportCsv, exportPdf,
} from '../api/reports';
import MonthSelector   from '../components/dashboard/MonthSelector';
import useAuthStore     from '../store/authStore';
import { formatCurrency, getCurrencySymbol } from '../utils/formatCurrency';
import { localToday }     from '../utils/formatDate';

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'monthly',  label: 'Mensual',        emoji: '📅' },
  { id: 'annual',   label: 'Anual',           emoji: '📆' },
  { id: 'category', label: 'Por categoría',   emoji: '🏷️' },
];

const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const fmtEvLabel = (label) => {
  const [y, m] = label.split('-');
  return `${MONTH_SHORT[parseInt(m) - 1]} '${y.slice(2)}`;
};

const firstOfMonthISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

// ── Reusable mini-components ──────────────────────────────────────────────────

function KpiMini({ label, value, icon, gradient, textColor }) {
  return (
    <div className="card !p-3 sm:!p-5 border border-gray-100 dark:border-gray-700 min-w-0">
      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm mb-2 sm:mb-3`}>
        <span className="text-sm sm:text-lg">{icon}</span>
      </div>
      <p className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
      <p className={`text-xs sm:text-xl font-extrabold tracking-tight mt-0.5 leading-tight break-words ${textColor}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function SectionHeader({ emoji, title, extra }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mb-4">
      <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-base flex-shrink-0">
        {emoji}
      </div>
      <h3 className="font-bold text-gray-800 dark:text-white">{title}</h3>
      {extra && (
        <span className="basis-full sm:basis-auto sm:ml-auto text-xs sm:text-sm font-normal text-gray-400 truncate">
          {extra}
        </span>
      )}
    </div>
  );
}

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name}:</span>
          <span className="font-bold text-gray-800 dark:text-white">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 text-sm">
      <p className="font-semibold text-gray-800 dark:text-white mb-1">{p.payload.icon} {p.name}</p>
      <p className="text-gray-500">{formatCurrency(p.value)} — <span className="font-bold">{p.payload.percentage}%</span></p>
    </div>
  );
}

function UpgradeModal({ feature, onClose }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 pb-16 sm:pb-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 text-center animate-slide-up">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">
          ⭐
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Función Pro</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          {feature === 'pdf' ? 'Exportar a PDF' : 'Exportar a CSV'} está disponible en el plan <strong>Pro</strong> o <strong>Family</strong>.
          Sube de plan para desbloquear exportaciones ilimitadas.
        </p>
        <div className="space-y-2">
          <button onClick={() => navigate('/settings')} className="w-full btn-primary gap-2">
            ⭐ Ver planes
          </button>
          <button onClick={onClose} className="w-full btn-secondary">Ahora no</button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Mensual ──────────────────────────────────────────────────────────────

function TabMonthly() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear ] = useState(now.getFullYear());
  const [data,  setData ] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data: res } = await getMonthlyReport({ month, year });
      setData(res.data);
    } catch { setError('Error al cargar el reporte'); }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { fetch(); }, [fetch]);

  const breakdown = data?.categoryBreakdown?.filter((r) => r.type === 'EGRESO' && r.total > 0)
    .sort((a, b) => b.total - a.total) ?? [];
  const maxTotal = breakdown[0]?.total || 1;

  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <MonthSelector month={month} year={year}
          onChange={(m, y) => { setMonth(m); setYear(y); }} />
      </div>

      {error && (
        <div className="text-center text-gray-400 py-8">
          <p>{error}</p>
          <button onClick={fetch} className="btn-primary mt-3 gap-2 w-auto px-5">
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 animate-pulse">
          {[1,2,3].map((i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl" />)}
        </div>
      ) : data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <KpiMini label="Ingresos" value={data.income}  icon="📈" gradient="from-emerald-500 to-teal-600" textColor="text-emerald-600 dark:text-emerald-400" />
            <KpiMini label="Egresos"  value={data.expense} icon="📉" gradient="from-rose-500 to-pink-600"    textColor="text-rose-600 dark:text-rose-400" />
            <KpiMini label="Neto"     value={data.net}     icon="⚖️" gradient="from-blue-500 to-indigo-600"
              textColor={data.net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'} />
          </div>

          {/* Category breakdown */}
          {breakdown.length > 0 ? (
            <div className="card">
              <SectionHeader emoji="🏷️" title="Gastos por categoría" />
              <div className="space-y-3">
                {breakdown.slice(0, 10).map((r) => (
                  <div key={r.categoryId || r.type} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: (r.category?.color || '#6366f1') + '22' }}>
                      {r.category?.icon || '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                          {r.category?.name || 'Sin categoría'}
                        </span>
                        <span className="text-sm font-bold text-gray-800 dark:text-white flex-shrink-0">
                          {formatCurrency(r.total)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(r.total / maxTotal) * 100}%`,
                            backgroundColor: r.category?.color || '#6366f1',
                          }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <span className="text-4xl block mb-2">🎉</span>
              <p>Sin egresos registrados este mes</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Tab: Anual ────────────────────────────────────────────────────────────────

function TabAnnual() {
  const [data,    setData   ] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data: res } = await getBalanceEvolution({ months: 12 });
      setData(res.data);
    } catch { setError('Error al cargar evolución'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const totalIncome  = data.reduce((s, d) => s + d.income,  0);
  const totalExpense = data.reduce((s, d) => s + d.expense, 0);
  const totalNet     = totalIncome - totalExpense;

  const bestMonth  = data.reduce((best, d) => (!best || d.net > best.net  ) ? d : best, null);
  const worstMonth = data.reduce((wst,  d) => (!wst  || d.net < wst.net  ) ? d : wst, null);

  const chartData = data.map((d) => ({
    name:     fmtEvLabel(d.label),
    Ingresos: d.income,
    Egresos:  d.expense,
  }));

  return (
    <div className="space-y-5">
      <p className="text-center text-sm text-gray-400">Últimos 12 meses</p>

      {error && <p className="text-center text-gray-400 py-8">{error}</p>}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[1,2,3].map((i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl" />)}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        </div>
      ) : data.length > 0 && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <KpiMini label="Ingresos totales" value={totalIncome}  icon="📈" gradient="from-emerald-500 to-teal-600" textColor="text-emerald-600 dark:text-emerald-400" />
            <KpiMini label="Egresos totales"  value={totalExpense} icon="📉" gradient="from-rose-500 to-pink-600"    textColor="text-rose-600 dark:text-rose-400" />
            <KpiMini label="Neto acumulado"   value={totalNet}     icon="⚖️" gradient="from-blue-500 to-indigo-600"
              textColor={totalNet >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'} />
          </div>

          {/* Bar chart */}
          <div className="card">
            <SectionHeader emoji="📊" title="Ingresos vs Egresos" extra="últimos 12 meses" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barCategoryGap="30%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${getCurrencySymbol()}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)', radius: 8 }} />
                <Bar dataKey="Ingresos" fill="#10b981" radius={[6,6,0,0]} maxBarSize={36} />
                <Bar dataKey="Egresos"  fill="#f43f5e" radius={[6,6,0,0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Best / Worst */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {bestMonth && (
              <div className="card bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide truncate">Mejor mes</span>
                </div>
                <p className="font-bold text-gray-800 dark:text-white text-sm sm:text-base">{fmtEvLabel(bestMonth.label)}</p>
                <p className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base sm:text-lg truncate">{formatCurrency(bestMonth.net)}</p>
              </div>
            )}
            {worstMonth && (
              <div className="card bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span className="text-[11px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide truncate">Peor mes</span>
                </div>
                <p className="font-bold text-gray-800 dark:text-white text-sm sm:text-base">{fmtEvLabel(worstMonth.label)}</p>
                <p className="text-rose-600 dark:text-rose-400 font-extrabold text-base sm:text-lg truncate">{formatCurrency(worstMonth.net)}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab: Por Categoría ────────────────────────────────────────────────────────

function TabByCategory() {
  const [desde,   setDesde  ] = useState(firstOfMonthISO());
  const [hasta,   setHasta  ] = useState(localToday());
  const [type,    setType   ] = useState('EGRESO');
  const [data,    setData   ] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await getByCategoryReport({ desde, hasta, type: type || undefined });
      setData(res.data.filter((d) => d.total > 0));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [desde, hasta, type]);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered  = type ? data.filter((d) => d.type === type) : data;
  const totalAmt  = filtered.reduce((s, d) => s + d.total, 0);

  const chartData = filtered.slice(0, 8).map((d) => ({
    name:       d.category?.name || 'Otros',
    value:      d.total,
    color:      d.category?.color || '#6366f1',
    icon:       d.category?.icon  || '📦',
    percentage: totalAmt > 0 ? +((d.total / totalAmt) * 100).toFixed(1) : 0,
  }));

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Desde</label>
            <input type="date" className="input-base text-sm" value={desde}
              onChange={(e) => setDesde(e.target.value)} max={hasta} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Hasta</label>
            <input type="date" className="input-base text-sm" value={hasta}
              onChange={(e) => setHasta(e.target.value)} min={desde} max={localToday()} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo</label>
            <div className="flex gap-2">
              {[
                { val: 'EGRESO',  label: 'Gastos' },
                { val: 'INGRESO', label: 'Ingresos' },
                { val: '',        label: 'Todo' },
              ].map((opt) => (
                <button key={opt.val} type="button"
                  onClick={() => setType(opt.val)}
                  className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all ${
                    type === opt.val
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <span className="text-5xl block mb-3">🔍</span>
          <p>Sin transacciones en el rango seleccionado</p>
        </div>
      ) : (
        <>
          {/* Donut */}
          {chartData.length > 0 && (
            <div className="card">
              <SectionHeader emoji="🥧" title="Distribución" />
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <ResponsiveContainer width={220} height={200}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" outerRadius={85} innerRadius={40}
                      dataKey="value" labelLine={false}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 w-full space-y-2 min-w-0">
                  {chartData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <span className="text-base flex-shrink-0">{d.icon}</span>
                      <span className="text-gray-700 dark:text-gray-200 flex-1 truncate">{d.name}</span>
                      <span className="font-semibold text-gray-800 dark:text-white flex-shrink-0">{formatCurrency(d.value)}</span>
                      <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">{d.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ranked list */}
          <div className="card">
            <SectionHeader emoji="🏆" title="Ranking completo" extra={`Total: ${formatCurrency(totalAmt)}`} />
            <div className="space-y-3">
              {filtered.map((r, i) => (
                <div key={r.categoryId || i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-300 dark:text-gray-600 w-5 text-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: (r.category?.color || '#6366f1') + '22' }}>
                    {r.category?.icon || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {r.category?.name || 'Sin categoría'}
                      </span>
                      <span className="text-sm font-bold text-gray-800 dark:text-white flex-shrink-0">
                        {formatCurrency(r.total)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{
                          width: `${r.percentage}%`,
                          backgroundColor: r.category?.color || '#6366f1',
                        }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-9 text-right flex-shrink-0">
                    {r.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Export toolbar ────────────────────────────────────────────────────────────

function ExportToolbar({ canExport, exportDesde, exportHasta, setExportDesde, setExportHasta, onExportCsv, onExportPdf, csvLoading, pdfLoading }) {
  return (
    <div className="card !p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${canExport ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
            {canExport ? <Download className="w-4 h-4 text-violet-600 dark:text-violet-400" /> : <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-white">Exportar reporte</p>
            {!canExport && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate">Función del plan Pro/Family</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
          <input type="date" className="input-base text-xs h-9 px-2 w-[7.5rem]"
            value={exportDesde} onChange={(e) => setExportDesde(e.target.value)} />
          <span className="text-gray-400 text-sm">→</span>
          <input type="date" className="input-base text-xs h-9 px-2 w-[7.5rem]"
            value={exportHasta} onChange={(e) => setExportHasta(e.target.value)} />

          <button onClick={onExportCsv} disabled={csvLoading}
            className={`flex items-center gap-1.5 h-9 text-xs font-semibold px-3 rounded-xl transition disabled:opacity-50 flex-shrink-0 ${
              canExport
                ? 'bg-violet-600 hover:bg-violet-700 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}>
            {csvLoading ? <span className="animate-spin text-sm">⏳</span> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            CSV
            {!canExport && <Lock className="w-3 h-3" />}
          </button>
          <button onClick={onExportPdf} disabled={pdfLoading}
            className={`flex items-center gap-1.5 h-9 text-xs font-semibold px-3 rounded-xl border transition disabled:opacity-50 flex-shrink-0 ${
              canExport
                ? 'border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}>
            {pdfLoading ? <span className="animate-spin text-sm">⏳</span> : <FileText className="w-3.5 h-3.5" />}
            PDF
            {!canExport && <Lock className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const plan = useAuthStore((s) => s.user?.plan) || 'FREE';
  const canExport = plan === 'PRO' || plan === 'FAMILY';

  const [tab,         setTab        ] = useState('monthly');
  const [csvLoading,  setCsvLoading ] = useState(false);
  const [pdfLoading,  setPdfLoading ] = useState(false);
  const [upgradeFor,  setUpgradeFor ] = useState(null); // 'csv' | 'pdf' | null
  const [exportDesde, setExportDesde] = useState(firstOfMonthISO());
  const [exportHasta, setExportHasta] = useState(localToday());

  const handleExport = async () => {
    if (!canExport) { setUpgradeFor('csv'); return; }
    setCsvLoading(true);
    try {
      const { data: blob } = await exportCsv({ desde: exportDesde, hasta: exportHasta });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;
      link.download = `transacciones_${exportDesde}_${exportHasta}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (err.response?.status === 403) setUpgradeFor('csv');
    } finally {
      setCsvLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!canExport) { setUpgradeFor('pdf'); return; }
    setPdfLoading(true);
    try {
      const { data: blob } = await exportPdf({ desde: exportDesde, hasta: exportHasta });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;
      link.download = `reporte_${exportDesde}_${exportHasta}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (err.response?.status === 403) setUpgradeFor('pdf');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white">Reportes</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Analiza tus finanzas con detalle
          </p>
        </div>
        {!canExport && (
          <button onClick={() => setUpgradeFor('csv')}
            className="hidden sm:inline-flex items-center gap-1.5 flex-shrink-0 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all">
            <Sparkles className="w-3.5 h-3.5" /> Mejora a Pro
          </button>
        )}
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-full sm:w-fit overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.id
                ? 'bg-white dark:bg-gray-900 text-gray-800 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            <span>{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Export toolbar */}
      <ExportToolbar
        canExport={canExport}
        exportDesde={exportDesde} exportHasta={exportHasta}
        setExportDesde={setExportDesde} setExportHasta={setExportHasta}
        onExportCsv={handleExport} onExportPdf={handleExportPdf}
        csvLoading={csvLoading} pdfLoading={pdfLoading}
      />

      {/* Tab content */}
      {tab === 'monthly'  && <TabMonthly />}
      {tab === 'annual'   && <TabAnnual />}
      {tab === 'category' && <TabByCategory />}

      {upgradeFor && <UpgradeModal feature={upgradeFor} onClose={() => setUpgradeFor(null)} />}
    </div>
  );
}
