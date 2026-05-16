export const formatCurrency = (amount, currency = 'PEN') => {
  const locales = { PEN: 'es-PE', USD: 'en-US' };
  return new Intl.NumberFormat(locales[currency] || 'es-PE', {
    style:                 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
};

export const formatAmount = (amount) =>
  new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(amount) || 0);
