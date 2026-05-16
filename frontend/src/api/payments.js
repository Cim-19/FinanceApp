import api from './axios';

export const createCharge = (data) => api.post('/payments/charge', data);
