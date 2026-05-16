const prisma = require('../config/prisma');

exports.list = async (req, res, next) => {
  try {
    const now = new Date();
    const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
    const year  = req.query.year  ? Number(req.query.year)  : now.getFullYear();

    const budgets = await prisma.budget.findMany({
      where:   { userId: req.user.id, month, year },
      include: { category: true },
    });

    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59);

    const enriched = await Promise.all(
      budgets.map(async (budget) => {
        const agg = await prisma.transaction.aggregate({
          where: {
            userId:     req.user.id,
            categoryId: budget.categoryId,
            type:       'EGRESO',
            isTransfer: false,
            date:       { gte: start, lte: end },
          },
          _sum: { amount: true },
        });
        const spent = Number(agg._sum.amount || 0);
        return { ...budget, spent, percentage: Number(budget.amount) > 0 ? (spent / Number(budget.amount)) * 100 : 0 };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { categoryId, month, year, amount } = req.body;
    const budget = await prisma.budget.create({
      data: {
        userId: req.user.id,
        categoryId,
        month:  Number(month),
        year:   Number(year),
        amount,
      },
      include: { category: true },
    });
    res.status(201).json({ success: true, data: budget });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.budget.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Presupuesto no encontrado' });

    const budget = await prisma.budget.update({
      where:   { id: req.params.id },
      data:    { amount: req.body.amount },
      include: { category: true },
    });
    res.json({ success: true, data: budget });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await prisma.budget.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Presupuesto no encontrado' });

    await prisma.budget.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Presupuesto eliminado correctamente' });
  } catch (err) { next(err); }
};
