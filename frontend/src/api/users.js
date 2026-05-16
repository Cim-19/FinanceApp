import api from './axios';

export const getProfile      = ()       => api.get('/users/profile');
export const updateProfile   = (data)   => api.put('/users/profile', data);
export const changePassword  = (data)   => api.put('/users/password', data);
export const importCsv       = (rows)   => api.post('/transactions/import', { transactions: rows });
