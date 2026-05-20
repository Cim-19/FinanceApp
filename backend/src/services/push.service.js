const webpush = require('web-push');
const prisma   = require('../config/prisma');

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || 'admin@financeapp.com'}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Envía push a un usuario específico
async function sendPushToUser(userId, payload) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
    } catch (err) {
      // 410 Gone = suscripción expirada, limpiar
      if (err.statusCode === 410 || err.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }
}

// Envía push a todos los usuarios con suscripción activa
async function sendPushToAll(payload) {
  const subs = await prisma.pushSubscription.findMany({ include: { user: { select: { isActive: true } } } });
  const active = subs.filter((s) => s.user.isActive);
  for (const sub of active) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }
  console.log(`📲 Push enviado a ${active.length} suscripciones`);
}

module.exports = { sendPushToUser, sendPushToAll };
