const router = require('express').Router();
const ctrl   = require('../controllers/config.controller');

router.get('/public', ctrl.getPublicConfig);

module.exports = router;
