const prisma = require('../config/prisma');

const LIMITS = {
  FREE: { accounts: 2, transactionsPerMonth: 50 },
};

/**
 * Factory que devuelve un middleware según la acción:
 *   'CREATE_ACCOUNT'      → máx 2 cuentas (plan Free)
 *   'CREATE_TRANSACTION'  → máx 50 transacciones/mes (plan Free)
 *   'EXPORT'              → solo plan Pro / Family
 */
const planGuard = (action) => async (req, res, next) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
    });
    const plan = subscription?.plan || 'FREE';

    if (plan !== 'FREE') return next();

    if (action === 'CREATE_ACCOUNT') {
      const count = await prisma.account.count({ where: { userId: req.user.id } });
      if (count >= LIMITS.FREE.accounts) {
        return res.status(403).json({
          success: false,
          error: `Plan Free: máximo ${LIMITS.FREE.accounts} cuentas. Actualiza a Pro para crear más.`,
          code: 'PLAN_LIMIT_ACCOUNTS',
        });
      }
    }

    if (action === 'CREATE_TRANSACTION') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const count = await prisma.transaction.count({
        where: { userId: req.user.id, date: { gte: start, lte: end } },
      });
      if (count >= LIMITS.FREE.transactionsPerMonth) {
        return res.status(403).json({
          success: false,
          error: `Plan Free: máximo ${LIMITS.FREE.transactionsPerMonth} transacciones por mes. Actualiza a Pro.`,
          code: 'PLAN_LIMIT_TRANSACTIONS',
        });
      }
    }

    if (action === 'EXPORT') {
      return res.status(403).json({
        success: false,
        error: 'La exportación de datos está disponible solo en plan Pro o Family.',
        code: 'PLAN_LIMIT_EXPORT',
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = planGuard;
