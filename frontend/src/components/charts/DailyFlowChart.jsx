import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getCurrencySymbol } from '../../utils/formatCurrency';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const net = (payload.find(p => p.dataKey === 'Ingresos')?.value || 0)
            - (payload.find(p => p.dataKey === 'Egresos')?.value  || 0);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Día {label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name}:</span>
          <span className="font-bold text-gray-800 dark:text-white">{getCurrencySymbol()} {Number(p.value).toFixed(2)}</span>
        </div>
      ))}
      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <span className="text-xs text-gray-400">Neto: </span>
        <span className={`text-xs font-bold ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {getCurrencySymbol()} {net.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default function DailyFlowChart({ data, month, year }) {
  if (!data?.length) return null;

  const hasActivity = data.some(d => d.income > 0 || d.expense > 0);
  if (!hasActivity) return null;

  const monthLabel = month ? `${MONTHS[month - 1]} ${year}` : '';

  const chartData = data.map((d) => ({
    name:     d.day,
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
            <span>📆</span> Flujo diario
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">{monthLabel}</p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Ingresos</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{getCurrencySymbol()} {totalIncome.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Egresos</p>
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400">-{getCurrencySymbol()} {totalExpense.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            interval={4}
            tickFormatter={(v) => `${v}`}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Area
            type="monotone"
            dataKey="Ingresos"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#colorIngresos)"
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Area
            type="monotone"
            dataKey="Egresos"
            stroke="#f43f5e"
            strokeWidth={2}
            fill="url(#colorEgresos)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
