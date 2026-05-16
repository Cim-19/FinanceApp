const bcrypt = require('bcryptjs');
const prisma  = require('../config/prisma');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: {
        id: true, name: true, email: true,
        currency: true, theme: true, createdAt: true,
        subscription: true,
      },
    });
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, currency, theme } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name     && { name }),
        ...(currency && { currency }),
        ...(theme    && { theme }),
      },
      select: { id: true, name: true, email: true, currency: true, theme: true },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Contraseña actual incorrecta' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (err) { next(err); }
};
