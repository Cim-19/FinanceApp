import api from './axios';

export const getAdminStats      = ()             => api.get('/admin/stats');
export const getAdminUsers      = (params)       => api.get('/admin/users', { params });
export const getAdminUser       = (id)           => api.get(`/admin/users/${id}`);
export const updateUserPlan     = (id, plan)     => api.put(`/admin/users/${id}/plan`,          { plan });
export const toggleUserActive   = (id)           => api.put(`/admin/users/${id}/toggle-active`);
export const updateUserRole     = (id, role)     => api.put(`/admin/users/${id}/role`,          { role });
