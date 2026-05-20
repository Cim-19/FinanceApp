// Parsea strings de fecha (ISO o "YYYY-MM-DD") como fecha LOCAL, no UTC.
// new Date("2026-05-19") crea medianoche UTC → en Lima (UTC-5) sería el día anterior.
// new Date(2026, 4, 19) crea medianoche local → siempre el día correcto.
const parseLocal = (date) => {
  if (!date) return new Date();
  const str = typeof date === 'string' ? date.split('T')[0] : date.toISOString().split('T')[0];
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

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

// Fecha de hoy en zona local (para usar como valor por defecto en formularios)
export const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
