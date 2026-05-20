const cron = require('node-cron');
const { sendPushToAll } = require('./push.service');

const SAVINGS_TIPS = [
  'Regla 50/30/20: destina 50% a necesidades, 30% a gustos y 20% a ahorro. 💪',
  'Antes de comprar algo, espera 24 horas. Si aún lo quieres, cómpralo. 🛒',
  'Revisa tus suscripciones y cancela las que no uses. ¡Cada sol cuenta! 💳',
  'Cocinar en casa puede ahorrarte hasta S/. 300 al mes. 🍳',
  'Automatiza tu ahorro: aparta un monto fijo cada quincena sin pensarlo. 🤖',
  'Compara precios antes de comprar electrónicos. Los jueves y viernes suelen tener mejores ofertas. 📱',
  'Lleva una lista al supermercado y cíñete a ella. Reduce gastos impulsivos un 30%. 🛍️',
  'El café diario fuera de casa puede costar S/. 150 al mes. ¡Considera una cafetera! ☕',
  'Revisa tu historial de transacciones en FinanceApp para encontrar gastos que puedas reducir. 📊',
  'Pequeñas metas de ahorro son más fáciles de cumplir. Empieza con S/. 50 al mes. 🎯',
];

let tipIndex = 0;

function startPushCrons() {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log('⚠️  Push notifications desactivadas (sin claves VAPID)');
    return;
  }

  // Recordatorio diario — 9 PM Lima (02:00 UTC) de lunes a viernes
  cron.schedule('0 2 * * 1-5', async () => {
    try {
      await sendPushToAll({
        title: '💰 FinanceApp',
        body: '¿Ya registraste tus gastos de hoy? No dejes que se escapen.',
        url: '/transactions',
        icon: '/icons/icon-192x192.png',
      });
    } catch (err) {
      console.error('[Push] Error recordatorio diario:', err.message);
    }
  }, { timezone: 'UTC' });

  // Tip de ahorro — cada lunes 8 AM Lima (13:00 UTC)
  cron.schedule('0 13 * * 1', async () => {
    try {
      const tip = SAVINGS_TIPS[tipIndex % SAVINGS_TIPS.length];
      tipIndex++;
      await sendPushToAll({
        title: '💡 Tip de ahorro semanal',
        body: tip,
        url: '/dashboard',
        icon: '/icons/icon-192x192.png',
      });
    } catch (err) {
      console.error('[Push] Error tip semanal:', err.message);
    }
  }, { timezone: 'UTC' });

  console.log('📲  Push crons iniciados (recordatorio 9PM Lima L-V · tip lunes 8AM Lima)');
}

module.exports = { startPushCrons };
