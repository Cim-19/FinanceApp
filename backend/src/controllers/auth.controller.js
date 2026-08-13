const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const prisma   = require('../config/prisma');
const email    = require('../services/email.service');

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, tokenVersion: user.tokenVersion || 0 };
  const accessToken  = jwt.sign(payload, process.env.JWT_SECRET,         { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d'  });
  return { accessToken, refreshToken };
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const isProd = process.env.NODE_ENV === 'production';

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? 'none' : 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });
};

const safeUser = (u) => ({
  id: u.id, name: u.name, email: u.email,
  currency: u.currency, theme: u.theme, role: u.role,
  plan: u.subscription?.plan || 'FREE',
});

// ── Controllers ───────────────────────────────────────────────────────────────

exports.register = async (req, res, next) => {
  try {
    const { name, email: userEmail, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email: userEmail } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'El email ya está registrado' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email: userEmail,
        password: hashed,
        subscription: { create: { plan: 'FREE' } },
      },
    });

    const { accessToken, refreshToken } = generateTokens(user);
    setRefreshCookie(res, refreshToken);

    // Email de bienvenida — no bloqueamos la respuesta si falla
    email.sendWelcome(user.email, user.name).catch(() => {});

    res.status(201).json({
      success: true,
      data: { accessToken, user: safeUser(user) },
    });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where:   { email },
      include: { subscription: true },
    });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'Tu cuenta ha sido desactivada. Contacta al soporte.' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    setRefreshCookie(res, refreshToken);

    res.json({ success: true, data: { accessToken, user: safeUser(user) } });
  } catch (err) { next(err); }
};

exports.refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Refresh token requerido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Se revalida contra la base en cada refresh: una cuenta desactivada o una
    // contraseña reseteada invalida los refresh tokens ya emitidos, en vez de
    // dejarlos operar hasta su expiración de 7 días.
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.isActive || (payload.tokenVersion || 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json({ success: false, error: 'Sesión inválida, inicia sesión nuevamente' });
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, tokenVersion: user.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.json({ success: true, data: { accessToken } });
  } catch {
    res.status(401).json({ success: false, error: 'Refresh token inválido o expirado' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('refreshToken', { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'strict' });
  res.json({ success: true, message: 'Sesión cerrada correctamente' });
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email: userEmail } = req.body;
    if (!userEmail) return res.status(400).json({ success: false, error: 'El email es requerido' });

    const user = await prisma.user.findUnique({ where: { email: userEmail } });

    // Respondemos igual aunque el email no exista (seguridad)
    if (!user) return res.json({ success: true, message: 'Si el email existe, recibirás las instrucciones' });

    const token  = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Se guarda el hash del token, no el token en claro — si la base se filtra,
    // los enlaces de reset ya emitidos no quedan directamente utilizables.
    await prisma.user.update({
      where: { id: user.id },
      data:  { resetToken: hashToken(token), resetTokenExpiry: expiry },
    });

    await email.sendPasswordReset(user.email, user.name, token);

    res.json({ success: true, message: 'Si el email existe, recibirás las instrucciones' });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Token y contraseña son requeridos' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken:       hashToken(token),
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'El enlace es inválido o ya expiró' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data:  {
        password: hashed,
        resetToken: null,
        resetTokenExpiry: null,
        tokenVersion: { increment: 1 }, // invalida cualquier refresh token ya emitido
      },
    });

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: {
        id: true, name: true, email: true,
        currency: true, theme: true, role: true, createdAt: true,
        subscription: true,
      },
    });
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};
