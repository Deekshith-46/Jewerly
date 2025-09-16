// models/Order.js
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // optional
  productSnapshot: Object, // snapshot of product details at purchase-time
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
  subtotal: Number,
  tax: Number,
  shippingCost: Number,
  total: Number,
  status: { type: String, enum: ['processing', 'shipped', 'delivered', 'cancelled'], default: 'processing' },
  paymentStatus: { type: String, enum: ['pending','paid','failed'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
