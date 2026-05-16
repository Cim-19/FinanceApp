import api from './axios';

export const listNotifications  = ()   => api.get('/notifications');
export const markRead           = (id) => api.put(`/notifications/${id}/read`);
export const markAllRead        = ()   => api.put('/notifications/read-all');
export const removeNotification = (id) => api.delete(`/notifications/${id}`);
