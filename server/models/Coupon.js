const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discount: { type: Number, required: true },
  type: { type: String, enum: ['percentage', 'fixed', 'free_shipping'], default: 'percentage' },
  minOrder: { type: Number, default: 0 },
  maxDiscount: { type: Number },
  maxUses: { type: Number },
  usedCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  expiresAt: { type: Date },
  active: { type: Boolean, default: true },
}, { timestamps: true });

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ active: 1, expiresAt: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
