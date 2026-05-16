const router  = require('express').Router();
const authJWT = require('../middlewares/authJWT');
const ctrl    = require('../controllers/notifications.controller');

router.use(authJWT);

router.get('/',           ctrl.list);
router.put('/read-all',   ctrl.markAllRead);
router.put('/:id/read',   ctrl.markRead);
router.delete('/:id',     ctrl.remove);

module.exports = router;
