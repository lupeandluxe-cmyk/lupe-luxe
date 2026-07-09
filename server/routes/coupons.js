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
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
  if (!coupon) return res.status(400).json({ valid: false, message: 'Invalid coupon' });
  if (coupon.expiresAt && coupon.expiresAt < new Date())
    return res.status(400).json({ valid: false, message: 'Coupon expired' });
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
    return res.status(400).json({ valid: false, message: 'Coupon usage limit reached' });
  if (orderTotal < coupon.minOrder)
    return res.status(400).json({ valid: false, message: `Min order ₹${coupon.minOrder}` });
  let discount = coupon.type === 'percentage' ? (orderTotal * coupon.discount) / 100 : coupon.discount;
  res.json({ valid: true, discount, code: coupon.code });
});

router.post('/', protect, admin, async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json(coupon);
});

router.put('/:id', protect, admin, async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(coupon);
});

router.delete('/:id', protect, admin, async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ message: 'Coupon deleted' });
});

module.exports = router;
