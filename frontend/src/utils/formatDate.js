export const formatDate = (date, opts = {}) =>
  new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric', ...opts })
    .format(new Date(date));

export const formatDateShort = (date) =>
  new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' }).format(new Date(date));

export const formatMonthYear = (date) =>
  new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(new Date(date));

export const toInputDate = (date) => new Date(date).toISOString().split('T')[0];
