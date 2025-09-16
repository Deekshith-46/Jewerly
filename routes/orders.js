// routes/orders.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const orderCtrl = require('../controllers/orderController');

router.post('/', protect, orderCtrl.createOrder);
router.get('/my', protect, orderCtrl.getUserOrders);
router.get('/', protect, isAdmin, orderCtrl.getOrders);
router.put('/:id', protect, isAdmin, orderCtrl.updateOrderStatus);

module.exports = router;
