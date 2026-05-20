import api from './axios';

export const getVapidPublicKey = ()       => api.get('/push/vapid-public-key');
export const subscribePush     = (data)   => api.post('/push/subscribe',   data);
export const unsubscribePush   = (data)   => api.post('/push/unsubscribe', data);
