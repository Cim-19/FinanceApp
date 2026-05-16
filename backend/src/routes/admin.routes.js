const router       = require('express').Router();
const ctrl         = require('../controllers/admin.controller');
const authJWT      = require('../middlewares/authJWT');
const requireAdmin = require('../middlewares/requireAdmin');

router.use(authJWT, requireAdmin);

router.get('/stats',                 ctrl.getStats);
router.get('/users',                 ctrl.listUsers);
router.get('/users/:id',             ctrl.getUser);
router.put('/users/:id/plan',        ctrl.updatePlan);
router.put('/users/:id/toggle-active', ctrl.toggleActive);
router.put('/users/:id/role',        ctrl.updateRole);
router.get('/config',                ctrl.getConfig);
router.put('/config',                ctrl.setConfig);
router.post('/test-notification',    ctrl.testNotification);

module.exports = router;
