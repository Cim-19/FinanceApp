// Cachés de Workbox que guardan respuestas de la API con datos financieros del
// usuario (ver sw.js). En un dispositivo compartido, si no se limpian al cerrar
// sesión, el siguiente usuario que entre puede ver datos del usuario anterior
// servidos desde caché antes de que llegue la respuesta de red.
const USER_DATA_CACHES = [
  'transactions-cache',
  'accounts-cache',
  'reports-cache',
  'static-api-cache',
];

export async function clearUserDataCaches() {
  if (typeof caches === 'undefined') return;
  try {
    const names = await caches.keys();
    await Promise.all(
      names.filter((n) => USER_DATA_CACHES.includes(n)).map((n) => caches.delete(n))
    );
  } catch {
    // best-effort — si Cache Storage no está disponible, no bloquea el logout
  }
}
