const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/categories.controller');
const authJWT  = require('../middlewares/authJWT');
const validate = require('../middlewares/validate');

router.use(authJWT);

router.get('/', ctrl.list);

router.post('/',
  validate([
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('type').optional().isIn(['INGRESO', 'EGRESO', 'AMBOS']).withMessage('Tipo inválido'),
    body('color').optional().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Color inválido'),
  ]),
  ctrl.create
);

router.put('/:id',
  validate([
    body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('type').optional().isIn(['INGRESO', 'EGRESO', 'AMBOS']).withMessage('Tipo inválido'),
    body('color').optional().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Color inválido'),
  ]),
  ctrl.update
);

router.delete('/:id', ctrl.remove);

module.exports = router;
