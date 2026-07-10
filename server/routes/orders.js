const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { protect, admin } = require('../middleware/auth');
const { sendOrderEmail } = require('../services/email');

const router = express.Router();

router.post('/', protect, async (req, res) => {
  const { items, shippingAddress, paymentMethod, itemsPrice, discount, couponCode, totalPrice, upiTransactionId, upiScreenshot } = req.body;
  if (items?.length === 0) return res.status(400).json({ message: 'No order items' });

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
    if (coupon) {
      coupon.usedCount = (coupon.usedCount || 0) + 1;
      await coupon.save();
    }
  }

  if (paymentMethod !== 'upi') {
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.countInStock = Math.max(0, product.countInStock - item.qty);
        await product.save();
      }
    }
  }

  const order = await Order.create({
    user: req.user._id, items, shippingAddress, paymentMethod,
    itemsPrice, discount: discount || 0, couponCode: couponCode || undefined,
    shippingPrice: 0, taxPrice: 0, totalPrice,
    upiTransactionId: upiTransactionId || undefined,
    upiScreenshot: upiScreenshot || undefined,
    upiPaymentStatus: paymentMethod === 'upi' ? 'pending' : undefined,
    orderStatus: paymentMethod === 'cod' ? 'confirmed' : 'pending',
  });

  sendOrderEmail(order);

  res.status(201).json(order);
});

router.get('/mine', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

router.get('/:id', protect, async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (order) res.json(order);
  else res.status(404).json({ message: 'Order not found' });
});

router.put('/:id/pay', protect, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    const updated = await order.save();
    res.json(updated);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

router.get('/', protect, admin, async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name').sort({ createdAt: -1 });
  res.json(orders);
});

router.put('/:id/deliver', protect, admin, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    const updated = await order.save();
    res.json(updated);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

router.put('/:id/status', protect, admin, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.orderStatus = req.body.orderStatus;
    if (req.body.trackingNumber) order.trackingNumber = req.body.trackingNumber;
    if (req.body.orderStatus === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }
    if (req.body.orderStatus === 'cancelled' || req.body.orderStatus === 'returned') {
      order.isPaid = false;
    }
    const updated = await order.save();
    res.json(updated);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

router.put('/:id/upi-verify', protect, admin, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.upiPaymentStatus = req.body.status;
    if (req.body.status === 'verified') {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.orderStatus = 'confirmed';
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.countInStock = Math.max(0, product.countInStock - item.qty);
          await product.save();
        }
      }
    }
    if (req.body.status === 'rejected') {
      order.isPaid = false;
    }
    const updated = await order.save();
    res.json(updated);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

router.put('/:id/upi-retry', protect, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  if (order.upiPaymentStatus !== 'rejected') {
    return res.status(400).json({ message: 'Can only retry after rejection' });
  }
  order.upiTransactionId = req.body.upiTransactionId;
  order.upiScreenshot = req.body.upiScreenshot || order.upiScreenshot;
  order.upiPaymentStatus = 'pending';
  const updated = await order.save();
  res.json(updated);
});

module.exports = router;
