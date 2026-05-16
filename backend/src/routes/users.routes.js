const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/users.controller');
const authJWT  = require('../middlewares/authJWT');
const validate = require('../middlewares/validate');

router.use(authJWT);

router.get('/profile', ctrl.getProfile);

router.put('/profile',
  validate([
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Mínimo 2 caracteres'),
    body('currency').optional().isIn(['PEN', 'USD']).withMessage('Moneda inválida'),
    body('theme').optional().isIn(['LIGHT', 'DARK']).withMessage('Tema inválido'),
  ]),
  ctrl.updateProfile
);

router.put('/password',
  validate([
    body('currentPassword').notEmpty().withMessage('La contraseña actual es requerida'),
    body('newPassword').isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres'),
  ]),
  ctrl.changePassword
);

module.exports = router;
