const router = require('express').Router();
const authJWT = require('../middlewares/authJWT');
const ctrl    = require('../controllers/payments.controller');

router.use(authJWT);

router.post('/charge', ctrl.createCharge);

module.exports = router;
