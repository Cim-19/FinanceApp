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
    </div>
  );
};

export default function IncomeExpenseBar({ data }) {
  const chartData = data.map((d) => ({
    name:    d.label,
    Ingresos: d.income,
    Egresos:  d.expense,
  }));

  return (
    <div className="card">
      <h3 className="font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
        <span>📊</span> Ingresos vs Egresos
      </h3>
      <p className="text-xs text-gray-400 mb-4">Últimos 6 meses</p>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} barCategoryGap="30%" barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
            tickFormatter={(v) => `S/.${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)', radius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
          <Bar dataKey="Ingresos" fill="#10b981" radius={[6,6,0,0]} maxBarSize={40} />
          <Bar dataKey="Egresos"  fill="#f43f5e" radius={[6,6,0,0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
