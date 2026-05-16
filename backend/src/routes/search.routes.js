const router  = require('express').Router();
const ctrl    = require('../controllers/search.controller');
const authJWT = require('../middlewares/authJWT');

router.use(authJWT);
router.get('/', ctrl.search);

module.exports = router;
