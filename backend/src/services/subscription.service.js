const cron   = require('node-cron');
const prisma = require('../config/prisma');
const { createIfNotToday } = require('./notifications.service');
const email = require('./email.service');

const PLAN_LABEL = { FREE: 'Free', PRO: 'Pro', FAMILY: 'Family' };

async function checkExpiringSubscriptions() {
  const in3days = new Date();
  in3days.setDate(in3days.getDate() + 3);
  in3days.setHours(23, 59, 59, 999);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const subs = await prisma.subscription.findMany({
    where: {
      plan:        { not: 'FREE' },
      status:      'ACTIVE',
      renewalDate: { gte: today, lte: in3days },
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  for (const sub of subs) {
    const planName = PLAN_LABEL[sub.plan] || sub.plan;
    const title    = `Tu plan ${planName} se renueva en 3 días`;

    await createIfNotToday(sub.userId, {
      type:  'SUBSCRIPTION_EXPIRING',
      title,
      body:  `El cobro se realizará el ${new Date(sub.renewalDate).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
      link:  '/settings',
    }).catch(() => {});

    email.sendSubscriptionExpiring(sub.user.email, sub.user.name, planName, sub.renewalDate)
      .catch(() => {});
  }

  if (subs.length > 0) {
    console.log(`🔔 [Subscriptions] ${subs.length} avisos de renovación enviados`);
  }
}

// No hay recobro automático (Culqi se usa con cargos únicos, sin tarjeta guardada),
// así que una suscripción pagada nunca debe seguir activa después de su fecha de
// renovación sin un nuevo pago — se baja a FREE/EXPIRED en vez de quedar indefinida.
async function expireOverdueSubscriptions() {
  const now = new Date();

  const overdue = await prisma.subscription.findMany({
    where: {
      plan:        { not: 'FREE' },
      status:      'ACTIVE',
      renewalDate: { lt: now },
    },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  for (const sub of overdue) {
    const planName = PLAN_LABEL[sub.plan] || sub.plan;

    await prisma.subscription.update({
      where: { userId: sub.userId },
      data:  { plan: 'FREE', status: 'EXPIRED' },
    });

    await createIfNotToday(sub.userId, {
      type:  'SUBSCRIPTION_EXPIRING',
      title: `Tu plan ${planName} expiró`,
      body:  'No se detectó un nuevo pago antes de la fecha de renovación. Tu cuenta volvió al plan Free.',
      link:  '/settings',
    }).catch(() => {});

    email.sendSubscriptionExpiring?.(sub.user.email, sub.user.name, planName, sub.renewalDate).catch(() => {});
  }

  if (overdue.length > 0) {
    console.log(`⬇️  [Subscriptions] ${overdue.length} suscripciones vencidas bajadas a FREE`);
  }
}

function startSubscriptionJob() {
  cron.schedule('10 9 * * *', () => {
    checkExpiringSubscriptions().catch((err) =>
      console.error('[Subscriptions] Cron error:', err.message)
    );
    expireOverdueSubscriptions().catch((err) =>
      console.error('[Subscriptions] Expiry cron error:', err.message)
    );
  });
  console.log('🔔  Subscription expiry job iniciado (diario 09:10)');
}

module.exports = { startSubscriptionJob, checkExpiringSubscriptions, expireOverdueSubscriptions };
