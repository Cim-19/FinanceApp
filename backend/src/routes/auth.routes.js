const router     = require('express').Router();
const { body }   = require('express-validator');
const ctrl       = require('../controllers/auth.controller');
const validate   = require('../middlewares/validate');
const authJWT    = require('../middlewares/authJWT');
const { loginLimiter, registerLimiter, forgotPasswordLimiter } = require('../middlewares/rateLimit');

router.post('/register',
  registerLimiter,
  validate([
    body('name').trim().notEmpty().withMessage('El nombre es requerido').isLength({ min: 2 }).withMessage('Mínimo 2 caracteres'),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  ]),
  ctrl.register
);

router.post('/login',
  loginLimiter,
  validate([
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
  ]),
  ctrl.login
);

router.post('/refresh', ctrl.refresh);
router.post('/logout',  ctrl.logout);
router.get('/me', authJWT, ctrl.me);

router.post('/forgot-password',
  forgotPasswordLimiter,
  validate([body('email').isEmail().withMessage('Email inválido').normalizeEmail()]),
  ctrl.forgotPassword
);

router.post('/reset-password',
  forgotPasswordLimiter,
  validate([
    body('token').notEmpty().withMessage('Token requerido'),
    body('newPassword').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres'),
  ]),
  ctrl.resetPassword
);

module.exports = router;
