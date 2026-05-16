import api from './axios';

export const getPublicConfig = ()     => api.get('/config/public');
export const getAdminConfig  = ()     => api.get('/admin/config');
export const setAdminConfig  = (data) => api.put('/admin/config', data);
