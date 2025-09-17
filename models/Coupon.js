const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ["percentage", "fixed"],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  usageLimit: {
    type: Number,
    default: 1
  },
  usedCount: {
    type: Number,
    default: 0
  },
  perUserLimit: { type: Number, default: 1 }, // <-- add this
  expiresAt: Date,
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Coupon", couponSchema);
