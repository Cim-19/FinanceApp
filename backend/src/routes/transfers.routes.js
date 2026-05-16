const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/transfers.controller');
const authJWT  = require('../middlewares/authJWT');
const validate = require('../middlewares/validate');

router.use(authJWT);

router.get('/', ctrl.list);

router.post('/',
  validate([
    body('fromAccountId').notEmpty().withMessage('La cuenta de origen es requerida'),
    body('toAccountId').notEmpty().withMessage('La cuenta de destino es requerida'),
    body('amount').isFloat({ gt: 0 }).withMessage('El monto debe ser mayor a 0'),
    body('date').optional().isISO8601().withMessage('Fecha inválida'),
  ]),
  ctrl.create
);

module.exports = router;
