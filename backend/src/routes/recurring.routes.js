const router = require('express').Router();
const authJWT = require('../middlewares/authJWT');
const ctrl    = require('../controllers/recurring.controller');

router.use(authJWT);

router.get('/',       ctrl.list);
router.patch('/:id',  ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
