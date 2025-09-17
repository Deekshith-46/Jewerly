// controllers/couponController.js
const Coupon = require('../models/Coupon');

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code } = req.params;

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });

    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });

    // Expiry check
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Coupon expired' });
    }

    // Usage limit check
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
