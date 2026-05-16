import { useState, useEffect, useCallback } from 'react';
import {
  getFamily, createFamily, updateFamily, deleteFamily,
  inviteMember, cancelInvitation, removeMember, leaveFamily,
  getFamilyDashboard,
  upsertFamilyBudget, deleteFamilyBudget,
  createFamilyGoal, updateFamilyGoal, deleteFamilyGoal, contributeToGoal,
} from '../api/family';

export default function useFamily() {
  const [family,    setFamily   ] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading,   setLoading  ] = useState(true);
  const [error,     setError    ] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getFamily();
      setFamily(data.data);
      getFamilyDashboard()
        .then((r) => setDashboard(r.data.data))
        .catch(() => {});
    } catch (err) {
      if (err.response?.status === 404) {
        setFamily(null);
      } else {
        setError(err.response?.data?.error || 'Error al cargar la familia');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (name) => {
    const { data } = await createFamily({ name });
    await fetch();
    return data.data;
  };

  const update = async (name) => {
    await updateFamily({ name });
    setFamily((f) => ({ ...f, name }));
  };

  const destroy = async () => {
    await deleteFamily();
    setFamily(null);
    setDashboard(null);
  };

  const invite = async (email) => {
    const { data } = await inviteMember({ email });
    await fetch();
    return data;
  };

  const cancelInvite = async (inviteId) => {
    await cancelInvitation(inviteId);
    await fetch();
  };

  const removeMemberById = async (memberId) => {
    await removeMember(memberId);
    await fetch();
  };

  const leave = async () => {
    await leaveFamily();
    setFamily(null);
    setDashboard(null);
  };

  // Presupuestos familiares
  const saveBudget = async (data) => {
    await upsertFamilyBudget(data);
    const r = await getFamilyDashboard();
    setDashboard(r.data.data);
  };

  const removeBudget = async (budgetId) => {
    await deleteFamilyBudget(budgetId);
    const r = await getFamilyDashboard();
    setDashboard(r.data.data);
  };

  // Metas de ahorro familiares
  const addGoal = async (data) => {
    const r = await createFamilyGoal(data);
    const dash = await getFamilyDashboard();
    setDashboard(dash.data.data);
    return r.data.data;
  };

  const editGoal = async (goalId, data) => {
    await updateFamilyGoal(goalId, data);
    const r = await getFamilyDashboard();
    setDashboard(r.data.data);
  };

  const removeGoal = async (goalId) => {
    await deleteFamilyGoal(goalId);
    const r = await getFamilyDashboard();
    setDashboard(r.data.data);
  };

  const contributeGoal = async (goalId, data) => {
    const r = await contributeToGoal(goalId, data);
    const dash = await getFamilyDashboard();
    setDashboard(dash.data.data);
    return r.data;
  };

  return {
    family, dashboard, loading, error, fetch,
    create, update, destroy, invite, cancelInvite, removeMemberById, leave,
    saveBudget, removeBudget,
    addGoal, editGoal, removeGoal, contributeGoal,
  };
}
