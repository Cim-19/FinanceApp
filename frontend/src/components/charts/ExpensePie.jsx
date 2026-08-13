import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getCurrencySymbol } from '../../utils/formatCurrency';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 text-sm">
      <div className="flex items-center gap-2 mb-1">
        <span>{p.icon}</span>
        <span className="font-semibold text-gray-800 dark:text-white">{name}</span>
      </div>
      <p className="text-gray-500 dark:text-gray-400">{getCurrencySymbol()} <span className="font-bold text-gray-800 dark:text-white">{Number(value).toFixed(2)}</span></p>
      <p className="text-gray-400 text-xs">{p.percentage}% del total</p>
    </div>
  );
};

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

export default function ExpensePie({ data }) {
  const expenses = data.filter((d) => d.type === 'EGRESO' && d.total > 0);

  if (expenses.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-10 text-center">
        <p className="text-4xl mb-2">🥧</p>
        <h3 className="font-bold text-gray-800 dark:text-white mb-1">Gastos por categoría</h3>
        <p className="text-sm text-gray-400">Sin egresos este mes</p>
      </div>
    );
  }

  const chartData = expenses.slice(0, 8).map((d) => ({
    name:       d.category?.name || 'Otros',
    value:      d.total,
    color:      d.category?.color || '#6366f1',
    icon:       d.category?.icon || '📦',
    percentage: d.percentage,
  }));

  return (
    <div className="card">
      <h3 className="font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
        <span>🥧</span> Gastos por categoría
      </h3>
      <p className="text-xs text-gray-400 mb-4">Este mes</p>

      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" outerRadius={90} innerRadius={40}
            dataKey="value" labelLine={false} label={renderLabel}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Leyenda manual */}
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        {chartData.map((d, i) => (
          <div key={`${d.name}-${i}`} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="truncate">{d.icon} {d.name}</span>
            <span className="ml-auto font-semibold text-gray-800 dark:text-white">{d.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
