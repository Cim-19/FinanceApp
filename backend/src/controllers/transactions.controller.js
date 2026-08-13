const prisma  = require('../config/prisma');
const { createIfNotToday } = require('../services/notifications.service');
const email   = require('../services/email.service');

exports.list = async (req, res, next) => {
  try {
    const {
      type, categoryId, accountId,
      desde, hasta, search,
      page = 1, limit = 20,
      sortBy = 'date', sortOrder = 'desc',
      includeTransfers = 'false',
    } = req.query;

    const where = {
      userId:     req.user.id,
      isTransfer: includeTransfers === 'true' ? undefined : false,
      ...(type       && { type }),
      ...(categoryId && { categoryId }),
      ...(accountId  && { accountId }),
      ...(search     && { description: { contains: search, mode: 'insensitive' } }),
      ...((desde || hasta) && {
        date: {
          ...(desde && { gte: new Date(desde) }),
          ...(hasta && { lte: new Date(`${hasta}T23:59:59`) }),
        },
      }),
    };

    const validSort   = ['date', 'amount', 'createdAt'];
    const orderByField = validSort.includes(sortBy) ? sortBy : 'date';
    const orderBy     = { [orderByField]: sortOrder === 'asc' ? 'asc' : 'desc' };

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
          account:  { select: { id: true, name: true, type: true, color: true, icon: true } },
        },
        orderBy,
        skip,
        take,
      }),
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const tx = await prisma.transaction.findFirst({
      where:   { id: req.params.id, userId: req.user.id },
      include: { category: true, account: true, recurringRule: true },
    });
    if (!tx) return res.status(404).json({ success: false, error: 'Transacción no encontrada' });
    res.json({ success: true, data: tx });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { accountId, categoryId, type, amount, description, date, tags, recurringRule } = req.body;

    const account = await prisma.account.findFirst({ where: { id: accountId, userId: req.user.id } });
    if (!account) return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, OR: [{ userId: req.user.id }, { isSystem: true }] },
      });
      if (!category) return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId:      req.user.id,
          accountId,
          categoryId:  categoryId || null,
          type,
          amount,
          description: description || null,
          date:        new Date(date),
          tags:        tags || [],
          isTransfer:  false,
          ...(recurringRule ? {
            recurringRule: {
              create: {
                frequency: recurringRule.frequency,
                nextDate:  new Date(recurringRule.nextDate),
                endDate:   recurringRule.endDate ? new Date(recurringRule.endDate) : null,
              },
            },
          } : {}),
        },
        include: { category: true, account: true, recurringRule: true },
      });

      await tx.account.update({
        where: { id: accountId },
        data:  { balance: { [type === 'INGRESO' ? 'increment' : 'decrement']: Number(amount) } },
      });

      return transaction;
    });

    res.status(201).json({ success: true, data: result });

    // Check budget alerts after responding (non-blocking)
    if (result.type === 'EGRESO' && !result.isTransfer && result.categoryId) {
      checkBudgetAlert(req.user.id, result).catch(() => {});
    }
  } catch (err) { next(err); }
};

async function checkBudgetAlert(userId, tx) {
  const txDate = new Date(tx.date);
  const month  = txDate.getMonth() + 1;
  const year   = txDate.getFullYear();

  const budget = await prisma.budget.findFirst({
    where: { userId, categoryId: tx.categoryId, month, year },
  });
  if (!budget) return;

  const { _sum } = await prisma.transaction.aggregate({
    where: {
      userId,
      categoryId: tx.categoryId,
      type:       'EGRESO',
      isTransfer: false,
      date: {
        gte: new Date(year, month - 1, 1),
        lte: new Date(year, month, 0, 23, 59, 59),
      },
    },
    _sum: { amount: true },
  });

  const spent = Number(_sum.amount || 0);
  const limit = Number(budget.amount);
  const ratio = spent / limit;
  const catName = tx.category?.name || 'tu categoría';

  if (ratio >= 1) {
    await createIfNotToday(userId, {
      type:  'BUDGET_EXCEEDED',
      title: `Presupuesto superado — ${catName}`,
      body:  `Has gastado S/. ${spent.toFixed(2)} de S/. ${limit.toFixed(2)} en ${catName} este mes.`,
      link:  '/budgets',
    });
    // Fetch user email for email notification
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (user) {
      email.sendBudgetExceeded(user.email, user.name, catName, spent, limit).catch(() => {});
    }
  } else if (ratio >= 0.8) {
    await createIfNotToday(userId, {
      type:  'BUDGET_WARNING',
      title: `Presupuesto al ${Math.round(ratio * 100)}% — ${catName}`,
      body:  `Has gastado S/. ${spent.toFixed(2)} de S/. ${limit.toFixed(2)} en ${catName} este mes.`,
      link:  '/budgets',
    });
  }
}

exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Transacción no encontrada' });
    if (existing.isTransfer) {
      return res.status(400).json({ success: false, error: 'Las transferencias no se pueden editar directamente' });
    }

    const { accountId, categoryId, type, amount, description, date, tags } = req.body;
    const newAccountId = accountId || existing.accountId;
    const newType      = type      || existing.type;
    const newAmount    = amount !== undefined ? Number(amount) : Number(existing.amount);

    if (accountId && accountId !== existing.accountId) {
      const account = await prisma.account.findFirst({ where: { id: accountId, userId: req.user.id } });
      if (!account) return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
    }

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, OR: [{ userId: req.user.id }, { isSystem: true }] },
      });
      if (!category) return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Revertir efecto anterior en cuenta original
      await tx.account.update({
        where: { id: existing.accountId },
        data:  { balance: { [existing.type === 'INGRESO' ? 'decrement' : 'increment']: Number(existing.amount) } },
      });

      // Aplicar nuevo efecto (puede ser en otra cuenta)
      await tx.account.update({
        where: { id: newAccountId },
        data:  { balance: { [newType === 'INGRESO' ? 'increment' : 'decrement']: newAmount } },
      });

      return tx.transaction.update({
        where: { id: req.params.id },
        data: {
          ...(accountId  !== undefined && { accountId }),
          ...(categoryId !== undefined && { categoryId: categoryId || null }),
          ...(type       !== undefined && { type }),
          ...(amount     !== undefined && { amount }),
          ...(description !== undefined && { description }),
          ...(date       !== undefined && { date: new Date(date) }),
          ...(tags       !== undefined && { tags }),
        },
        include: { category: true, account: true },
      });
    });

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const FREE_MONTHLY_TRANSACTION_LIMIT = 50;

exports.importBulk = async (req, res, next) => {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ success: false, error: 'Se requiere un array de transacciones' });
    }

    // El plan Free tiene un límite mensual de transacciones; la importación
    // masiva no puede usarse para evadirlo, así que se recorta al cupo restante.
    const subscription = await prisma.subscription.findUnique({ where: { userId: req.user.id } });
    let rows = transactions.slice(0, 500);
    if ((subscription?.plan || 'FREE') === 'FREE') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const usedThisMonth = await prisma.transaction.count({
        where: { userId: req.user.id, createdAt: { gte: start, lte: end } },
      });
      const remaining = Math.max(0, FREE_MONTHLY_TRANSACTION_LIMIT - usedThisMonth);
      if (remaining === 0) {
        return res.status(403).json({
          success: false,
          error: `Plan Free: máximo ${FREE_MONTHLY_TRANSACTION_LIMIT} transacciones por mes. Actualiza a Pro.`,
          code: 'PLAN_LIMIT_TRANSACTIONS',
        });
      }
      rows = rows.slice(0, remaining);
    }

    // Pre-load user's accounts and categories for name-matching
    const [accounts, categories] = await Promise.all([
      prisma.account.findMany({ where: { userId: req.user.id }, select: { id: true, name: true } }),
      prisma.category.findMany({
        where: { OR: [{ isSystem: true }, { userId: req.user.id }] },
        select: { id: true, name: true },
      }),
    ]);

    const accountMap  = Object.fromEntries(accounts.map((a) => [a.name.toLowerCase(), a.id]));
    const categoryMap = Object.fromEntries(categories.map((c) => [c.name.toLowerCase(), c.id]));

    let imported = 0;
    const errors = [];

    const importRow = async (row) => {
      const type   = (row.type || '').toUpperCase();
      const amount = parseFloat(row.amount);
      const date   = new Date(row.date);

      if (!['INGRESO', 'EGRESO'].includes(type)) throw new Error('Tipo inválido');
      if (isNaN(amount) || amount <= 0)          throw new Error('Monto inválido');
      if (isNaN(date.getTime()))                  throw new Error('Fecha inválida');

      const accountId = accountMap[(row.account || '').toLowerCase()];
      if (!accountId) throw new Error(`Cuenta "${row.account}" no encontrada`);

      const categoryId = categoryMap[(row.category || '').toLowerCase()] || null;

      await prisma.$transaction(async (tx) => {
        await tx.transaction.create({
          data: {
            userId:      req.user.id,
            accountId,
            categoryId,
            type,
            amount,
            description: row.description || null,
            date,
            tags:        [],
            isTransfer:  false,
          },
        });
        await tx.account.update({
          where: { id: accountId },
          data:  { balance: { [type === 'INGRESO' ? 'increment' : 'decrement']: amount } },
        });
      });
    };

    // Se procesa en lotes concurrentes en vez de una fila a la vez — cada
    // increment/decrement de balance ya es atómico a nivel de fila en Postgres,
    // así que el paralelismo dentro de un lote es seguro.
    const BATCH_SIZE = 20;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(batch.map(importRow));
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          imported++;
        } else {
          errors.push({ row: batch[idx], error: result.reason?.message || 'Error desconocido' });
        }
      });
    }

    const skippedByPlan = transactions.length - rows.length;
    res.json({
      success: true,
      data: {
        imported,
        errors,
        total: transactions.length,
        ...(skippedByPlan > 0 && {
          skippedByPlan,
          planLimitMessage: `Plan Free: solo se importaron ${rows.length} de ${transactions.length} filas por el límite de ${FREE_MONTHLY_TRANSACTION_LIMIT} transacciones/mes.`,
        }),
      },
    });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Transacción no encontrada' });
    if (existing.isTransfer) {
      return res.status(400).json({ success: false, error: 'Elimina la transferencia desde el endpoint /api/transfers' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaction.delete({ where: { id: req.params.id } });
      await tx.account.update({
        where: { id: existing.accountId },
        data:  { balance: { [existing.type === 'INGRESO' ? 'decrement' : 'increment']: Number(existing.amount) } },
      });
    });

    res.json({ success: true, message: 'Transacción eliminada correctamente' });
  } catch (err) { next(err); }
};
