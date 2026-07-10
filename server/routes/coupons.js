const express = require('express');
const Coupon = require('../models/Coupon');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, admin, async (req, res) => {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 });
  res.json(coupons);
});

router.post('/validate', async (req, res) => {
  const { code, orderTotal } = req.body;
  const cleanCode = String(code || '').toUpperCase().trim();
  const coupon = await Coupon.findOne({ code: cleanCode, active: true });
  if (!coupon) return res.status(400).json({ valid: false, message: 'Coupon not found' });
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
    return res.status(400).json({ valid: false, message: 'Coupon expired' });
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
    return res.status(400).json({ valid: false, message: 'Coupon usage limit reached' });
  if (orderTotal < coupon.minOrder)
    return res.status(400).json({ valid: false, message: `Minimum order ₹${coupon.minOrder}` });
  let discount = coupon.type === 'percentage' ? (orderTotal * coupon.discount) / 100 : coupon.discount;
  discount = Math.round(discount * 100) / 100;
  res.json({ valid: true, discount, code: coupon.code });
});

router.post('/', protect, admin, async (req, res) => {
  const data = { ...req.body };
  if (data.code) data.code = String(data.code).toUpperCase().trim();
  if (data.discount) data.discount = Number(data.discount);
  if (data.minOrder) data.minOrder = Number(data.minOrder);
  if (data.maxUses) data.maxUses = Number(data.maxUses);
  if (data.expiresAt && !data.expiresAt) delete data.expiresAt;
  const coupon = await Coupon.create(data);
  res.status(201).json(coupon);
});

router.put('/:id', protect, admin, async (req, res) => {
  const data = { ...req.body };
  if (data.code) data.code = String(data.code).toUpperCase().trim();
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, data, { new: true });
  res.json(coupon);
});

router.delete('/:id', protect, admin, async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ message: 'Coupon deleted' });
});

module.exports = router;
