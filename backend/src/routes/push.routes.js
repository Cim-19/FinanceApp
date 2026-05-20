const router     = require('express').Router();
const authJWT    = require('../middlewares/authJWT');
const ctrl       = require('../controllers/push.controller');

router.get ('/vapid-public-key', ctrl.getVapidPublicKey);
router.post('/subscribe',   authJWT, ctrl.subscribe);
router.post('/unsubscribe', authJWT, ctrl.unsubscribe);

module.exports = router;
