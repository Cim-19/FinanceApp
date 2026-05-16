const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/budgets.controller');
const authJWT  = require('../middlewares/authJWT');
const validate = require('../middlewares/validate');

router.use(authJWT);

router.get('/', ctrl.list);

router.post('/',
  validate([
    body('categoryId').notEmpty().withMessage('La categoría es requerida'),
    body('month').isInt({ min: 1, max: 12 }).withMessage('Mes inválido (1-12)'),
    body('year').isInt({ min: 2020, max: 2100 }).withMessage('Año inválido'),
    body('amount').isFloat({ gt: 0 }).withMessage('El monto debe ser mayor a 0'),
  ]),
  ctrl.create
);

router.put('/:id',
  validate([
    body('amount').isFloat({ gt: 0 }).withMessage('El monto debe ser mayor a 0'),
  ]),
  ctrl.update
);

router.delete('/:id', ctrl.remove);

module.exports = router;
