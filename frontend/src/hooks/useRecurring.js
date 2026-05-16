import { useState, useEffect, useCallback } from 'react';
import { listRecurring, updateRecurring, deleteRecurring } from '../api/recurring';

export default function useRecurring() {
  const [rules,   setRules  ] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listRecurring();
      setRules(res.data.data);
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const update = async (id, data) => {
    await updateRecurring(id, data);
    await fetchRules();
  };

  const remove = async (id) => {
    await deleteRecurring(id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  return { rules, loading, update, remove, refresh: fetchRules };
}
