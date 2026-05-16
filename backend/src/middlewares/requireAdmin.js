const prisma = require('../config/prisma');

module.exports = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { role: true, isActive: true },
    });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Acceso restringido a administradores' });
    }
    next();
  } catch (err) { next(err); }
};
