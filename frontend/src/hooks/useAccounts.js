import { useState, useEffect, useCallback } from 'react';
import {
  getAccounts, createAccount, updateAccount,
  deleteAccount, createTransfer,
  upsertGoal as apiUpsertGoal, deleteGoal as apiDeleteGoal,
} from '../api/accounts';

export default function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading ] = useState(true);
  const [error,    setError   ] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getAccounts();
      setAccounts(data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar cuentas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (payload) => {
    const { data } = await createAccount(payload);
    setAccounts((prev) => [...prev, data.data]);
    return data.data;
  };

  const update = async (id, payload) => {
    const { data } = await updateAccount(id, payload);
    setAccounts((prev) => prev.map((a) => (a.id === id ? data.data : a)));
    return data.data;
  };

  const remove = async (id) => {
    await deleteAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const transfer = async (payload) => {
    const { data } = await createTransfer(payload);
    await fetch(); // recarga balances actualizados
    return data.data;
  };

  const updateGoal = async (accountId, payload) => {
    const { data } = await apiUpsertGoal(accountId, payload);
    setAccounts((prev) => prev.map((a) =>
      a.id === accountId ? { ...a, savingGoal: data.data } : a
    ));
    return data.data;
  };

  const removeGoal = async (accountId) => {
    await apiDeleteGoal(accountId);
    setAccounts((prev) => prev.map((a) =>
      a.id === accountId ? { ...a, savingGoal: null } : a
    ));
  };

  // Se suma en centavos enteros y se divide al final para evitar artefactos de
  // redondeo de punto flotante al acumular muchos balances decimales.
  const totalBalance = accounts.reduce((sum, a) => sum + Math.round(Number(a.balance) * 100), 0) / 100;

  const byType = {
    CORRIENTE: accounts.filter((a) => a.type === 'CORRIENTE'),
    AHORRO:    accounts.filter((a) => a.type === 'AHORRO'),
    INVERSION: accounts.filter((a) => a.type === 'INVERSION'),
    CREDITO:   accounts.filter((a) => a.type === 'CREDITO'),
  };

  return { accounts, byType, totalBalance, loading, error, fetch, create, update, remove, transfer, updateGoal, removeGoal };
}
