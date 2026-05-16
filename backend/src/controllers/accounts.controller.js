const prisma = require('../config/prisma');

exports.list = async (req, res, next) => {
  try {
    const accounts = await prisma.account.findMany({
      where:   { userId: req.user.id },
      include: { savingGoal: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: accounts });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const account = await prisma.account.findFirst({
      where:   { id: req.params.id, userId: req.user.id },
      include: { savingGoal: true },
    });
    if (!account) return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
    res.json({ success: true, data: account });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, type, balance, color, icon, savingGoal } = req.body;

    const account = await prisma.account.create({
      data: {
        userId:  req.user.id,
        name,
        type,
        balance: balance ?? 0,
        color:   color || '#6366f1',
        icon:    icon  || 'wallet',
        ...(type === 'AHORRO' && savingGoal ? {
          savingGoal: {
            create: {
              targetAmount: savingGoal.targetAmount,
              deadline: savingGoal.deadline ? new Date(savingGoal.deadline) : null,
            },
          },
        } : {}),
      },
      include: { savingGoal: true },
    });

    res.status(201).json({ success: true, data: account });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.account.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });

    const { name, color, icon, savingGoal } = req.body;

    const account = await prisma.account.update({
      where: { id: req.params.id },
      data: {
        ...(name  !== undefined && { name  }),
        ...(color !== undefined && { color }),
        ...(icon  !== undefined && { icon  }),
      },
      include: { savingGoal: true },
    });

    if (existing.type === 'AHORRO' && savingGoal) {
      await prisma.savingGoal.upsert({
        where:  { accountId: req.params.id },
        create: {
          accountId:    req.params.id,
          targetAmount: savingGoal.targetAmount,
          deadline:     savingGoal.deadline ? new Date(savingGoal.deadline) : null,
        },
        update: {
          targetAmount: savingGoal.targetAmount,
          deadline:     savingGoal.deadline ? new Date(savingGoal.deadline) : null,
        },
      });
    }

    res.json({ success: true, data: account });
  } catch (err) { next(err); }
};

exports.upsertGoal = async (req, res, next) => {
  try {
    const account = await prisma.account.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!account) return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
    if (account.type !== 'AHORRO') return res.status(400).json({ success: false, error: 'Solo cuentas de ahorro pueden tener metas' });

    const { targetAmount, deadline } = req.body;
    const goal = await prisma.savingGoal.upsert({
      where:  { accountId: req.params.id },
      create: { accountId: req.params.id, targetAmount, deadline: deadline ? new Date(deadline) : null },
      update: { targetAmount, deadline: deadline ? new Date(deadline) : null },
    });
    res.json({ success: true, data: goal });
  } catch (err) { next(err); }
};

exports.deleteGoal = async (req, res, next) => {
  try {
    const account = await prisma.account.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { savingGoal: true },
    });
    if (!account) return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
    if (!account.savingGoal) return res.status(404).json({ success: false, error: 'Meta no encontrada' });

    await prisma.savingGoal.delete({ where: { accountId: req.params.id } });
    res.json({ success: true, message: 'Meta eliminada' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await prisma.account.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });

    await prisma.account.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Cuenta eliminada correctamente' });
  } catch (err) { next(err); }
};
