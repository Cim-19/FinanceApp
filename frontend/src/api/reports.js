import api from './axios';

export const getMonthlyReport    = (params) => api.get('/reports/monthly',           { params });
export const getByCategoryReport = (params) => api.get('/reports/by-category',       { params });
export const getBalanceEvolution = (params) => api.get('/reports/balance-evolution', { params });
export const exportCsv           = (params) => api.get('/reports/export-csv',        { params, responseType: 'blob' });
export const getWeeklyReport     = (params) => api.get('/reports/weekly',             { params });
export const getDailyReport      = (params) => api.get('/reports/daily',              { params });
export const exportPdf           = (params) => api.get('/reports/export-pdf',         { params, responseType: 'blob' });
