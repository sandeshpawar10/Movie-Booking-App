const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');
const { verifyJWt } = require('../middlewares/authenticationMiddleware');
const { checkAdmin } = require('../middlewares/roleMiddleware');

router.get('/admin/analytics', verifyJWt, checkAdmin, controller.getAnalytics);

module.exports = router;
