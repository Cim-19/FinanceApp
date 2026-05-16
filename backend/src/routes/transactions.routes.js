const router    = require('express').Router();
const { body }  = require('express-validator');
const ctrl      = require('../controllers/transactions.controller');
const authJWT   = require('../middlewares/authJWT');
const validate  = require('../middlewares/validate');
const planGuard = require('../middlewares/planGuard');

router.use(authJWT);

router.get('/',    ctrl.list);
router.get('/:id', ctrl.getOne);

router.post('/',
  planGuard('CREATE_TRANSACTION'),
  validate([
    body('accountId').notEmpty().withMessage('La cuenta es requerida'),
    body('type').isIn(['INGRESO', 'EGRESO']).withMessage('Tipo debe ser INGRESO o EGRESO'),
    body('amount').isFloat({ gt: 0 }).withMessage('El monto debe ser mayor a 0'),
    body('date').isISO8601().withMessage('Fecha inválida (formato ISO8601)'),
  ]),
  ctrl.create
);

router.put('/:id',
  validate([
    body('type').optional().isIn(['INGRESO', 'EGRESO']).withMessage('Tipo debe ser INGRESO o EGRESO'),
    body('amount').optional().isFloat({ gt: 0 }).withMessage('El monto debe ser mayor a 0'),
    body('date').optional().isISO8601().withMessage('Fecha inválida'),
  ]),
  ctrl.update
);

router.post('/import', ctrl.importBulk);

router.delete('/:id', ctrl.remove);

module.exports = router;
