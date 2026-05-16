import api from './axios';

export const getAccounts    = ()       => api.get('/accounts');
export const getAccount     = (id)     => api.get(`/accounts/${id}`);
export const createAccount  = (data)   => api.post('/accounts', data);
export const updateAccount  = (id, data) => api.put(`/accounts/${id}`, data);
export const deleteAccount  = (id)     => api.delete(`/accounts/${id}`);
export const createTransfer = (data)   => api.post('/transfers', data);
export const upsertGoal     = (id, data) => api.put(`/accounts/${id}/goal`, data);
export const deleteGoal     = (id)       => api.delete(`/accounts/${id}/goal`);
