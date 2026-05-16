import { useState, useEffect, useCallback } from 'react';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../api/transactions';

const DEFAULT_FILTERS = {
  type: '', categoryId: '', accountId: '',
  desde: '', hasta: '', search: '',
  sortBy: 'date', sortOrder: 'desc',
  page: 1, limit: 15,
};

export default function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [meta,         setMeta        ] = useState({ total: 0, page: 1, pages: 1 });
  const [filters,      setFilters     ] = useState(DEFAULT_FILTERS);
  const [loading,      setLoading     ] = useState(true);
  const [error,        setError       ] = useState('');

  const fetch = useCallback(async (overrides = {}) => {
    setLoading(true);
    setError('');
    const params = { ...filters, ...overrides };
    // limpia params vacíos
    Object.keys(params).forEach((k) => { if (params[k] === '') delete params[k]; });
    try {
      const { data } = await getTransactions(params);
      setTransactions(data.data.transactions);
      setMeta({ total: data.data.total, page: data.data.page, pages: data.data.pages });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar transacciones');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const applyFilter = (key, value) => {
    const next = { ...filters, [key]: value, page: key === 'page' ? value : 1 };
    setFilters(next);
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const create = async (payload) => {
    const { data } = await createTransaction(payload);
    await fetch();
    return data.data;
  };

  const update = async (id, payload) => {
    const { data } = await updateTransaction(id, payload);
    await fetch();
    return data.data;
  };

  const remove = async (id) => {
    await deleteTransaction(id);
    await fetch();
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => !['page', 'limit', 'sortBy', 'sortOrder'].includes(k) && v !== ''
  );

  return {
    transactions, meta, filters, loading, error,
    applyFilter, resetFilters, hasActiveFilters,
    create, update, remove, refetch: fetch,
  };
}
