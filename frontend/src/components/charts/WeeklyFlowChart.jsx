import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name}:</span>
          <span className="font-bold text-gray-800 dark:text-white">S/. {Number(p.value).toFixed(2)}</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-400">Neto: </span>
          <span className={`text-xs font-bold ${payload[0].value - payload[1].value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            S/. {(payload[0].value - payload[1].value).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
};

export default function WeeklyFlowChart({ data, month, year }) {
  if (!data?.length) return null;

  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const monthLabel = month ? `${MONTHS[month - 1]} ${year}` : '';

  const chartData = data.map((d) => ({
    name:     d.label,
    Ingresos: d.income,
    Egresos:  d.expense,
  }));

  const totalIncome  = data.reduce((s, d) => s + d.income,  0);
  const totalExpense = data.reduce((s, d) => s + d.expense, 0);

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <span>📅</span> Flujo semanal
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">{monthLabel}</p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Ingresos</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+S/. {totalIncome.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Egresos</p>
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400">-S/. {totalExpense.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barCategoryGap="28%" barGap={3} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
            tickFormatter={(v) => `${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`} width={36} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)', radius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="Ingresos" fill="#10b981" radius={[6,6,0,0]} maxBarSize={36} />
          <Bar dataKey="Egresos"  fill="#f43f5e" radius={[6,6,0,0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
