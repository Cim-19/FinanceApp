import api from './axios';

export const globalSearch = (q) => api.get('/search', { params: { q, limit: 5 } });
