// models/Order.js
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // optional
  productSnapshot: Object,
  diamond: { type: mongoose.Schema.Types.ObjectId, ref: 'Diamond' }, // optional
  diamondSnapshot: Object,
  quantity: { type: Number, default: 1 },
  size: String,
  metal: String,
  engraving: String,
  price: Number
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [itemSchema],
  shippingAddress: Object,
  subtotal: Number,        // sum of item prices * qty (before tax/shipping/discount)
  tax: Number,
  shippingCost: Number,
  total: Number,           // subtotal + tax + shippingCost (before discount)
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
  discountAmount: { type: Number, default: 0 }, // amount subtracted from subtotal
  finalTotal: Number,      // total - discountAmount (amount customer pays)
  status: { type: String, enum: ['processing', 'shipped', 'delivered', 'cancelled'], default: 'processing' },
  paymentStatus: { type: String, enum: ['pending','paid','failed'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
