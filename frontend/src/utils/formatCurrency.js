import useAuthStore from '../store/authStore';

const SYMBOLS = { PEN: 'S/.', USD: '$' };
const LOCALES = { PEN: 'es-PE', USD: 'en-US' };

// Si no se pasa una divisa explícita, se usa la del usuario autenticado en vez
// de asumir PEN — de lo contrario un usuario en USD vería sus propios montos
// formateados en la moneda equivocada en toda la app.
function resolveCurrency(currency) {
  return currency || useAuthStore.getState().user?.currency || 'PEN';
}

export const formatCurrency = (amount, currency) => {
  const resolved = resolveCurrency(currency);
  return new Intl.NumberFormat(LOCALES[resolved] || 'es-PE', {
    style:                 'currency',
    currency:              resolved,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
};

export const getCurrencySymbol = (currency) => SYMBOLS[resolveCurrency(currency)] || 'S/.';

export const formatAmount = (amount) =>
  new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(amount) || 0);
