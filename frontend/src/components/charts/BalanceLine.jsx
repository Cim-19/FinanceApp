import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';
import { getCurrencySymbol } from '../../utils/formatCurrency';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 text-sm">
      <p className="text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`font-bold text-base ${val >= 0 ? 'text-violet-600' : 'text-rose-500'}`}>
        {getCurrencySymbol()} {Number(val).toFixed(2)}
      </p>
    </div>
  );
};

export default function BalanceLine({ data }) {
  const chartData = data.map((d) => ({
    name:    d.label,
    Balance: d.cumulativeBalance,
  }));

  const hasNegative = data.some((d) => d.cumulativeBalance < 0);

  return (
    <div className="card">
      <h3 className="font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
        <span>📈</span> Evolución del balance
      </h3>
      <p className="text-xs text-gray-400 mb-4">Últimos 6 meses — acumulado</p>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
            tickFormatter={(v) => `${getCurrencySymbol()}${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`} />
          <Tooltip content={<CustomTooltip />} />
          {hasNegative && <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="4 4" />}
          <Area type="monotone" dataKey="Balance" stroke="#7c3aed" strokeWidth={2.5}
            fill="url(#balanceGrad)" dot={{ fill: '#7c3aed', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#7c3aed' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
