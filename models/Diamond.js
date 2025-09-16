// models/Diamond.js
const mongoose = require('mongoose');

const diamondSchema = new mongoose.Schema({
  sku: { type: String, unique: true },
  shape: String,
  carat: Number,
  cut: String,
  clarity: String,
  color: String,
  labGrown: { type: Boolean, default: false },
  price: Number,
  stock: { type: Number, default: 0 },
  certificate: String,
  available: { type: Boolean, default: true }
}, { timestamps: true });

diamondSchema.index({ sku: 1 });

module.exports = mongoose.model('Diamond', diamondSchema);
