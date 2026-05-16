const prisma = require('../config/prisma');

const INCLUDE = {
  transaction: {
    include: {
      category: true,
      account:  { select: { id: true, name: true, type: true, color: true, icon: true } },
    },
  },
};

exports.list = async (req, res, next) => {
  try {
    const rules = await prisma.recurringRule.findMany({
      where:   { transaction: { userId: req.user.id } },
      include: INCLUDE,
      orderBy: { nextDate: 'asc' },
    });
    res.json({ success: true, data: rules });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const rule = await prisma.recurringRule.findFirst({
      where: { id: req.params.id, transaction: { userId: req.user.id } },
    });
    if (!rule) return res.status(404).json({ success: false, error: 'Regla no encontrada' });

    const { frequency, endDate } = req.body;
    const updated = await prisma.recurringRule.update({
      where:   { id: req.params.id },
      data:    {
        ...(frequency && { frequency }),
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : rule.endDate,
      },
      include: INCLUDE,
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const rule = await prisma.recurringRule.findFirst({
      where: { id: req.params.id, transaction: { userId: req.user.id } },
    });
    if (!rule) return res.status(404).json({ success: false, error: 'Regla no encontrada' });

    await prisma.recurringRule.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Recurrencia cancelada' });
  } catch (err) { next(err); }
};
