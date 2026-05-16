const cron   = require('node-cron');
const prisma = require('../config/prisma');
const { createNotification } = require('./notifications.service');

function addPeriod(date, frequency) {
  const d = new Date(date);
  switch (frequency) {
    case 'DAILY':   d.setDate(d.getDate() + 1);          break;
    case 'WEEKLY':  d.setDate(d.getDate() + 7);          break;
    case 'MONTHLY': d.setMonth(d.getMonth() + 1);        break;
    case 'YEARLY':  d.setFullYear(d.getFullYear() + 1);  break;
  }
  return d;
}

async function processRecurring() {
  const now = new Date();

  const rules = await prisma.recurringRule.findMany({
    where: {
      nextDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    include: {
      transaction: { include: { account: true } },
    },
  });

  for (const rule of rules) {
    const tmpl = rule.transaction;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.transaction.create({
          data: {
            userId:      tmpl.userId,
            accountId:   tmpl.accountId,
            categoryId:  tmpl.categoryId,
            type:        tmpl.type,
            amount:      tmpl.amount,
            description: tmpl.description,
            date:        rule.nextDate,
            tags:        tmpl.tags,
            isTransfer:  false,
          },
        });

        await tx.account.update({
          where: { id: tmpl.accountId },
          data:  { balance: { [tmpl.type === 'INGRESO' ? 'increment' : 'decrement']: Number(tmpl.amount) } },
        });

        const nextDate = addPeriod(rule.nextDate, rule.frequency);

        if (rule.endDate && nextDate > rule.endDate) {
          await tx.recurringRule.delete({ where: { id: rule.id } });
        } else {
          await tx.recurringRule.update({ where: { id: rule.id }, data: { nextDate } });
        }
      });

      // Notificación in-app
      const desc = tmpl.description || 'transacción recurrente';
      createNotification(tmpl.userId, {
        type:  'RECURRING_EXECUTED',
        title: `Transacción recurrente ejecutada`,
        body:  `Se registró "${desc}" por S/. ${Number(tmpl.amount).toFixed(2)}.`,
        link:  '/transactions',
      }).catch(() => {});
    } catch (err) {
      console.error(`[Recurring] Error en regla ${rule.id}:`, err.message);
    }
  }

  if (rules.length > 0) {
    console.log(`🔄 [Recurring] ${rules.length} transacciones procesadas`);
  }
}

function startRecurringJob() {
  // Ejecuta cada día a las 00:05
  cron.schedule('5 0 * * *', () => {
    processRecurring().catch((err) => console.error('[Recurring] Cron error:', err.message));
  });

  // Procesa pendientes al arrancar
  processRecurring().catch((err) => console.error('[Recurring] Startup error:', err.message));

  console.log('🔄  Recurring job iniciado (diario 00:05)');
}

module.exports = { startRecurringJob, processRecurring };
