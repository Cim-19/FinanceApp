import api from './axios';

export const listRecurring   = ()         => api.get('/recurring');
export const updateRecurring = (id, data) => api.patch(`/recurring/${id}`, data);
export const deleteRecurring = (id)       => api.delete(`/recurring/${id}`);
