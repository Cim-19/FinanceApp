const router    = require('express').Router();
const ctrl      = require('../controllers/reports.controller');
const authJWT   = require('../middlewares/authJWT');
const planGuard = require('../middlewares/planGuard');

router.use(authJWT);

router.get('/monthly',           ctrl.monthly);
router.get('/daily',             ctrl.daily);
router.get('/weekly',            ctrl.weekly);
router.get('/by-category',       ctrl.byCategory);
router.get('/balance-evolution', ctrl.balanceEvolution);
router.get('/export-csv',        planGuard('EXPORT'), ctrl.exportCsv);
router.get('/export-pdf',        planGuard('EXPORT'), ctrl.exportPdf);

module.exports = router;
