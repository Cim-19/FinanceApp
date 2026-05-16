const prisma = require('../config/prisma');

exports.list = async (req, res, next) => {
  try {
    const { desde, hasta, accountId, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      userId:     req.user.id,
      isTransfer: true,
      type:       'EGRESO',
      ...(accountId && { accountId }),
      ...(desde || hasta ? {
        date: {
          ...(desde && { gte: new Date(desde) }),
          ...(hasta && { lte: new Date(new Date(hasta).setHours(23, 59, 59, 999)) }),
        },
      } : {}),
    };

    const [transfers, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: Number(limit),
        include: {
          account: { select: { id: true, name: true, icon: true, type: true, color: true } },
          category: { select: { id: true, name: true, icon: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    // Para cada EGRESO, buscar el INGRESO par (mismo monto, fecha, descripción)
    const enriched = await Promise.all(transfers.map(async (t) => {
      const partner = await prisma.transaction.findFirst({
        where: {
          userId:      req.user.id,
          isTransfer:  true,
          type:        'INGRESO',
          amount:      t.amount,
          date:        t.date,
          description: t.description,
        },
        include: { account: { select: { id: true, name: true, icon: true, type: true } } },
      });
      return { ...t, toAccount: partner?.account ?? null };
    }));

    res.json({
      success: true,
      data: {
        transfers: enriched,
        meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
      },
    });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { fromAccountId, toAccountId, amount, description, date } = req.body;

    if (fromAccountId === toAccountId) {
      return res.status(400).json({ success: false, error: 'Las cuentas de origen y destino deben ser diferentes' });
    }

    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findFirst({ where: { id: fromAccountId, userId: req.user.id } }),
      prisma.account.findFirst({ where: { id: toAccountId,   userId: req.user.id } }),
    ]);

    if (!fromAccount) return res.status(404).json({ success: false, error: 'Cuenta de origen no encontrada' });
    if (!toAccount)   return res.status(404).json({ success: false, error: 'Cuenta de destino no encontrada' });

    const txDate = date ? new Date(date) : new Date();
    const desc   = description || `Transferencia: ${fromAccount.name} → ${toAccount.name}`;

    const result = await prisma.$transaction(async (tx) => {
      const egreso = await tx.transaction.create({
        data: {
          userId:      req.user.id,
          accountId:   fromAccountId,
          type:        'EGRESO',
          amount,
          description: desc,
          date:        txDate,
          isTransfer:  true,
          tags:        [],
        },
      });

      const ingreso = await tx.transaction.create({
        data: {
          userId:      req.user.id,
          accountId:   toAccountId,
          type:        'INGRESO',
          amount,
          description: desc,
          date:        txDate,
          isTransfer:  true,
          tags:        [],
        },
      });

      await tx.account.update({
        where: { id: fromAccountId },
        data:  { balance: { decrement: Number(amount) } },
      });

      await tx.account.update({
        where: { id: toAccountId },
        data:  { balance: { increment: Number(amount) } },
      });

      return { egreso, ingreso, from: fromAccount.name, to: toAccount.name, amount: Number(amount) };
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};
