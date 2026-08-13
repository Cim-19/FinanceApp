const rateLimit = require('express-rate-limit');

const jsonLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    error: 'Demasiados intentos. Intenta de nuevo en unos minutos.',
  });
};

// Login: el endpoint más sensible a fuerza bruta de contraseñas.
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonLimitHandler,
});

// Registro y forgot-password: previene enumeración de emails y spam de envíos.
exports.registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonLimitHandler,
});

exports.forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonLimitHandler,
});

// Límite general para toda la API, como red de contención adicional.
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonLimitHandler,
});
