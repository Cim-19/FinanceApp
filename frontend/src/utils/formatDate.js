const TZ = 'America/Lima';

// Para campos date-only (tx.date): "2026-05-19T00:00:00.000Z"
// new Date() los interpreta como UTC → en Lima sería el día anterior.
// Solución: extraer la parte YYYY-MM-DD y crear fecha local.
const parseLocal = (date) => {
  if (!date) return new Date();
  const str = typeof date === 'string' ? date.split('T')[0] : date.toISOString().split('T')[0];
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Formatea campos date-only (fecha de transacción, presupuesto, etc.)
export const formatDate = (date, opts = {}) =>
  new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric', ...opts })
    .format(parseLocal(date));

export const formatDateShort = (date) =>
  new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' }).format(parseLocal(date));

export const formatMonthYear = (date) =>
  new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(parseLocal(date));

export const toInputDate = (date) => {
  const d = parseLocal(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Formatea timestamps completos (createdAt, updatedAt) en zona Lima
// Convierte UTC → America/Lima independientemente del timezone del dispositivo
export const formatDateTime = (date) =>
  new Intl.DateTimeFormat('es-PE', {
    timeZone: TZ,
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(date));

export const formatDateTimeLima = (date) =>
  new Intl.DateTimeFormat('es-PE', {
    timeZone: TZ,
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date(date));

// Fecha de hoy en zona Lima — independiente del timezone del dispositivo
// en-CA usa formato YYYY-MM-DD nativamente
export const localToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
