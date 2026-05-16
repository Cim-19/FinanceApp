import api from './axios';

export const getFamily          = ()          => api.get('/family');
export const createFamily       = (data)      => api.post('/family', data);
export const updateFamily       = (data)      => api.put('/family', data);
export const deleteFamily       = ()          => api.delete('/family');

export const inviteMember       = (data)      => api.post('/family/invite', data);
export const cancelInvitation   = (inviteId)  => api.delete(`/family/invite/${inviteId}`);
export const acceptInvitation   = (token)     => api.post(`/family/join/${token}`);

export const removeMember       = (memberId)  => api.delete(`/family/members/${memberId}`);
export const leaveFamily        = ()          => api.delete('/family/leave');

export const getFamilyDashboard = ()          => api.get('/family/dashboard');

// Presupuestos familiares
export const upsertFamilyBudget = (data)      => api.put('/family/budgets', data);
export const deleteFamilyBudget = (budgetId)  => api.delete(`/family/budgets/${budgetId}`);

// Metas de ahorro familiares
export const createFamilyGoal    = (data)         => api.post('/family/goals', data);
export const updateFamilyGoal    = (goalId, data)  => api.put(`/family/goals/${goalId}`, data);
export const deleteFamilyGoal    = (goalId)        => api.delete(`/family/goals/${goalId}`);
export const contributeToGoal    = (goalId, data)  => api.post(`/family/goals/${goalId}/contribute`, data);
