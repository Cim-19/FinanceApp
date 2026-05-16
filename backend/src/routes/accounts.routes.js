const router    = require('express').Router();
const { body }  = require('express-validator');
const ctrl      = require('../controllers/accounts.controller');
const authJWT   = require('../middlewares/authJWT');
const validate  = require('../middlewares/validate');
const planGuard = require('../middlewares/planGuard');

const ACCOUNT_TYPES = ['CORRIENTE', 'AHORRO', 'INVERSION', 'CREDITO'];

router.use(authJWT);

router.get('/',     ctrl.list);
router.get('/:id',  ctrl.getOne);

router.post('/',
  planGuard('CREATE_ACCOUNT'),
  validate([
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('type').isIn(ACCOUNT_TYPES).withMessage(`Tipo inválido. Valores: ${ACCOUNT_TYPES.join(', ')}`),
    body('balance').optional().isNumeric().withMessage('El saldo debe ser numérico'),
  ]),
  ctrl.create
);

router.put('/:id',
  validate([
    body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('color').optional().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Color inválido (formato: #rrggbb)'),
  ]),
  ctrl.update
);

router.put('/:id/goal',
  validate([
    body('targetAmount').isNumeric().withMessage('El monto objetivo debe ser numérico'),
    body('deadline').optional({ nullable: true }).isISO8601().withMessage('Fecha inválida'),
  ]),
  ctrl.upsertGoal
);
router.delete('/:id/goal', ctrl.deleteGoal);
router.delete('/:id', ctrl.remove);

module.exports = router;
