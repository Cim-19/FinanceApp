const prisma = require('../config/prisma');

exports.search = async (req, res, next) => {
  try {
    const q     = (req.query.q || '').trim();
    const limit = Math.min(Number(req.query.limit) || 5, 10);

    if (q.length < 2) {
      return res.json({ success: true, data: { transactions: [], accounts: [], categories: [] } });
    }

    const userId = req.user.id;
    const where  = { contains: q, mode: 'insensitive' };

    const [transactions, accounts, categories] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          isTransfer: false,
          OR: [
            { description: where },
            { category: { name: where } },
          ],
        },
        orderBy: { date: 'desc' },
        take: limit,
        include: {
          account:  { select: { name: true, icon: true } },
          category: { select: { name: true, icon: true } },
        },
      }),

      prisma.account.findMany({
        where: { userId, name: where },
        take: limit,
        include: { savingGoal: true },
      }),

      prisma.category.findMany({
        where: {
          name: where,
          OR: [{ userId }, { isSystem: true }],
        },
        take: limit,
      }),
    ]);

    res.json({ success: true, data: { transactions, accounts, categories } });
  } catch (err) { next(err); }
};
