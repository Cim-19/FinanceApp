const router  = require('express').Router();
const ctrl    = require('../controllers/family.controller');
const authJWT = require('../middlewares/authJWT');

router.use(authJWT);

router.post('/',                    ctrl.createFamily);
router.get('/',                     ctrl.getFamily);
router.put('/',                     ctrl.updateFamily);
router.delete('/',                  ctrl.deleteFamily);

router.post('/invite',              ctrl.inviteMember);
router.delete('/invite/:inviteId',  ctrl.cancelInvitation);
router.post('/join/:token',         ctrl.acceptInvitation);

router.delete('/members/:memberId', ctrl.removeMember);
router.delete('/leave',             ctrl.leaveFamily);

router.get('/dashboard',            ctrl.getFamilyDashboard);

// Presupuestos familiares
router.put('/budgets',              ctrl.upsertFamilyBudget);
router.delete('/budgets/:budgetId', ctrl.deleteFamilyBudget);

// Metas de ahorro familiares
router.post('/goals',                        ctrl.createFamilyGoal);
router.put('/goals/:goalId',                 ctrl.updateFamilyGoal);
router.delete('/goals/:goalId',              ctrl.deleteFamilyGoal);
router.post('/goals/:goalId/contribute',     ctrl.contributeToGoal);

module.exports = router;
