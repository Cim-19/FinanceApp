import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export default function KpiCard({ title, value, icon, gradient, light, textColor, trend, trendLabel, currency = 'PEN' }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-rose-500' : 'text-gray-400';

  return (
    <div className={`card ${light} border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-200`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
          <span className="text-2xl">{icon}</span>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className={`text-xl font-extrabold mt-1 tracking-tight ${textColor}`}>
        {formatCurrency(value, currency)}
      </p>
      {trendLabel && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{trendLabel}</p>
      )}
    </div>
  );
}
