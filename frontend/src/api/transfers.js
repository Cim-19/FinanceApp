import api from './axios';

export const listTransfers  = (params) => api.get('/transfers', { params });
export const createTransfer = (data)   => api.post('/transfers', data);
