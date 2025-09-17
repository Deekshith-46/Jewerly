// routes/couponRoutes.js
const express = require('express');
const { createCoupon, validateCoupon } = require('../controllers/couponController');
const router = express.Router();

router.post('/', createCoupon); // Admin only
router.get('/:code', validateCoupon);

module.exports = router;
