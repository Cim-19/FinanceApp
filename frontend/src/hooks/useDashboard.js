import { useState, useEffect, useCallback } from 'react';
import { getMonthlyReport, getByCategoryReport, getBalanceEvolution, getWeeklyReport, getDailyReport } from '../api/reports';
import { getTransactions } from '../api/transactions';
import { getAccounts }     from '../api/accounts';
import { listRecurring }   from '../api/recurring';

export default function useDashboard(month, year) {
  const [data,    setData   ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [monthly, byCategory, evolution, recent, accounts, weekly, recurring, daily] = await Promise.all([
        getMonthlyReport({ month, year }),
        getByCategoryReport({ type: 'EGRESO', desde: `${year}-${String(month).padStart(2,'0')}-01`, hasta: `${year}-${String(month).padStart(2,'0')}-31` }),
        getBalanceEvolution({ months: 6 }),
        getTransactions({ limit: 5, page: 1, sortBy: 'date', sortOrder: 'desc' }),
        getAccounts(),
        getWeeklyReport({ month, year }),
        listRecurring(),
        getDailyReport({ month, year }),
      ]);

      setData({
        monthly:    monthly.data.data,
        byCategory: byCategory.data.data,
        evolution:  evolution.data.data,
        recent:     recent.data.data.transactions,
        accounts:   accounts.data.data,
        weekly:     weekly.data.data,
        recurring:  recurring.data.data,
        daily:      daily.data.data,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
