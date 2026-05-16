import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateShort } from '../../utils/formatDate';

export default function RecentTransactions({ transactions }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <span>⚡</span> Últimos movimientos
        </h3>
        <Link to="/transactions" className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-medium hover:underline">
          Ver todos <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <p className="text-3xl mb-2">💸</p>
          <p className="text-sm">Sin movimientos aún</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0
                ${tx.type === 'INGRESO' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
                {tx.category?.icon || (tx.isTransfer ? '💸' : '📦')}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {tx.description || tx.category?.name || 'Sin descripción'}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDateShort(tx.date)} · {tx.account?.name}
                </p>
              </div>

              <span className={`text-sm font-bold flex-shrink-0
                ${tx.type === 'INGRESO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {tx.type === 'INGRESO' ? '+' : '-'}{formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
