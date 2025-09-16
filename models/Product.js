// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, text: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required:true },
  price: { type: Number, required: true },   // base price for the setting
  metalOptions: [String],  // e.g. ['14K White Gold','18K Rose Gold','Platinum']
  availableShapes: [String], // shapes supported by the setting
  features: [String], // bezel, prong, cathedral...
  images: [String], // paths or urls
  stock: { type: Number, default: 0 }, // for setting inventory
  isCustomizable: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// create a text index for search in title + description
productSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
