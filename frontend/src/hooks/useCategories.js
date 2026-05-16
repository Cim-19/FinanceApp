import { useState, useEffect, useCallback } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories';

export default function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getCategories();
      setCategories(data.data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (payload) => {
    const { data } = await createCategory(payload);
    await fetch();
    return data.data;
  };

  const update = async (id, payload) => {
    const { data } = await updateCategory(id, payload);
    await fetch();
    return data.data;
  };

  const remove = async (id) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const income  = categories.filter((c) => c.type === 'INGRESO' || c.type === 'AMBOS');
  const expense = categories.filter((c) => c.type === 'EGRESO'  || c.type === 'AMBOS');
  const system  = categories.filter((c) => c.isSystem);
  const custom  = categories.filter((c) => !c.isSystem);

  return { categories, income, expense, system, custom, loading, fetch, create, update, remove };
}
