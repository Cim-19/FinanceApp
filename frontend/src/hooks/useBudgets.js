import { useState, useEffect, useCallback } from 'react';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../api/budgets';

export default function useBudgets(month, year) {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getBudgets({ month, year });
      setBudgets(data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar presupuestos');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (payload) => {
    const { data } = await createBudget({ ...payload, month, year });
    await fetch();
    return data.data;
  };

  const update = async (id, payload) => {
    const { data } = await updateBudget(id, payload);
    await fetch();
    return data.data;
  };

  const remove = async (id) => {
    await deleteBudget(id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  const totalBudgeted = budgets.reduce((s, b) => s + Number(b.amount), 0);
  const totalSpent    = budgets.reduce((s, b) => s + (b.spent || 0), 0);

  return { budgets, totalBudgeted, totalSpent, loading, error, fetch, create, update, remove };
}
