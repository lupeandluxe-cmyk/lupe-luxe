const express = require('express');
const Coupon = require('../models/Coupon');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, admin, async (req, res) => {
  const { search, type, active } = req.query;
  let filter = {};
  if (search) filter.code = { $regex: String(search).toUpperCase(), $options: 'i' };
  if (type) filter.type = type;
  if (active === 'true') filter.active = true;
  else if (active === 'false') filter.active = false;
  const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
  res.json(coupons);
});

router.post('/validate', async (req, res) => {
  const { code, orderTotal } = req.body;
  const cleanCode = String(code || '').toUpperCase().trim();
  const coupon = await Coupon.findOne({ code: cleanCode, active: true });
  if (!coupon) return res.status(400).json({ valid: false, message: 'Invalid coupon code' });
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
    return res.status(400).json({ valid: false, message: 'This coupon has expired' });
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
    return res.status(400).json({ valid: false, message: 'This coupon has reached its usage limit' });
  if (orderTotal < coupon.minOrder)
    return res.status(400).json({ valid: false, message: `Minimum order amount is ₹${coupon.minOrder}` });
  let discount = 0;
  if (coupon.type === 'free_shipping') {
    discount = 0;
  } else if (coupon.type === 'percentage') {
    discount = Math.round((orderTotal * coupon.discount) / 10000) * 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else {
    discount = coupon.discount;
  }
  discount = Math.max(0, Math.round(discount * 100) / 100);
  res.json({ valid: true, discount, code: coupon.code, type: coupon.type });
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.code || !String(data.code).trim())
      return res.status(400).json({ message: 'Coupon code is required' });
    if (data.discount === undefined || data.discount === '' || isNaN(Number(data.discount)))
      return res.status(400).json({ message: 'Valid discount is required' });
    data.code = String(data.code).toUpperCase().trim();
    data.discount = Number(data.discount);
    if (data.minOrder !== undefined && data.minOrder !== '') data.minOrder = Number(data.minOrder);
    if (data.maxDiscount !== undefined && data.maxDiscount !== '') data.maxDiscount = Number(data.maxDiscount);
    if (data.maxUses !== undefined && data.maxUses !== '') data.maxUses = Number(data.maxUses);
    if (data.perUserLimit !== undefined && data.perUserLimit !== '') data.perUserLimit = Number(data.perUserLimit);
    if (!data.expiresAt) delete data.expiresAt;
    const existing = await Coupon.findOne({ code: data.code });
    if (existing) return res.status(400).json({ message: 'Coupon code already exists' });
    const coupon = await Coupon.create(data);
    res.status(201).json(coupon);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Coupon code already exists' });
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.code) data.code = String(data.code).toUpperCase().trim();
    if (data.discount !== undefined && data.discount !== '') data.discount = Number(data.discount);
    else delete data.discount;
    if (data.minOrder !== undefined && data.minOrder !== '') data.minOrder = Number(data.minOrder);
    else delete data.minOrder;
    if (data.maxDiscount !== undefined && data.maxDiscount !== '') data.maxDiscount = Number(data.maxDiscount);
    else delete data.maxDiscount;
    if (data.maxUses !== undefined && data.maxUses !== '') data.maxUses = Number(data.maxUses);
    else delete data.maxUses;
    if (data.perUserLimit !== undefined && data.perUserLimit !== '') data.perUserLimit = Number(data.perUserLimit);
    else delete data.perUserLimit;
    if (!data.expiresAt) delete data.expiresAt;
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Coupon code already exists' });
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ message: 'Coupon deleted' });
});

module.exports = router;