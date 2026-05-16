const prisma = require('../config/prisma');

exports.list = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { OR: [{ isSystem: true }, { userId: req.user.id }] },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, icon, color, type } = req.body;
    const category = await prisma.category.create({
      data: {
        userId:   req.user.id,
        name,
        icon:     icon  || 'tag',
        color:    color || '#6366f1',
        type:     type  || 'AMBOS',
        isSystem: false,
      },
    });
    res.status(201).json({ success: true, data: category });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, userId: req.user.id, isSystem: false },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Categoría no encontrada o no editable' });
    }

    const { name, icon, color, type } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...(name  && { name  }),
        ...(icon  && { icon  }),
        ...(color && { color }),
        ...(type  && { type  }),
      },
    });
    res.json({ success: true, data: category });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, userId: req.user.id, isSystem: false },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Categoría no encontrada o no eliminable' });
    }

    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Categoría eliminada correctamente' });
  } catch (err) { next(err); }
};
