const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { protect, admin } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/security');
const { sendOrderEmail } = require('../services/email');
const logger = require('../services/logger');

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, itemsPrice, discount, couponCode, totalPrice, upiTransactionId, upiScreenshot } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }
    if (!shippingAddress?.fullName || !shippingAddress?.address || !shippingAddress?.city) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }
    if (!['cod', 'razorpay', 'upi'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }
    if (typeof totalPrice !== 'number' || totalPrice <= 0) {
      return res.status(400).json({ message: 'Invalid total price' });
    }

    for (const item of items) {
      if (!item.product || !item.qty || !item.price) {
        return res.status(400).json({ message: 'Invalid item data' });
      }
      if (!validateObjectId(item.product)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }
    }

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase().trim(), active: true });
      if (coupon) {
        coupon.usedCount = (coupon.usedCount || 0) + 1;
        await coupon.save();
      }
    }

    if (paymentMethod !== 'upi') {
      for (const item of items) {
        const product = await Product.findById(item.product);
        if (product) {
          if (product.countInStock < item.qty) {
            return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
          }
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

    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('new_order', { orderId: order._id, totalPrice: order.totalPrice, customer: req.user?.name });
    }

    sendOrderEmail(order).catch(err => logger.error('Order email failed', { message: err.message, orderId: order._id }));
    logger.payment(order._id, 'created', { method: paymentMethod, amount: totalPrice, userId: req.user._id });

    res.status(201).json(order);
  } catch (err) {
    logger.error('Order creation error', { message: err.message, userId: req.user?._id });
    res.status(500).json({ message: 'Order creation failed' });
  }
});

router.get('/mine', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!req.user.isAdmin && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

router.put('/:id/pay', protect, async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (order.isPaid) {
      return res.status(400).json({ message: 'Order already paid' });
    }
    order.isPaid = true;
    order.paidAt = Date.now();
    const updated = await order.save();
    logger.payment(order._id, 'marked_paid', { userId: req.user._id });
    res.json(updated);
  } catch (err) {
    logger.error('Payment update error', { message: err.message, orderId: req.params.id });
    res.status(500).json({ message: 'Payment update failed' });
  }
});

router.get('/', protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

router.put('/:id/deliver', protect, admin, async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.isDelivered) return res.status(400).json({ message: 'Already delivered' });
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    const updated = await order.save();
    logger.admin(req.user.email, 'order_delivered', { orderId: order._id });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update delivery' });
  }
});

router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
    if (!allowedStatuses.includes(req.body.orderStatus)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const oldOrderStatus = order.orderStatus;
    order.orderStatus = req.body.orderStatus;
    if (req.body.trackingNumber) order.trackingNumber = String(req.body.trackingNumber).trim();
    if (req.body.orderStatus === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }
    if (req.body.orderStatus === 'cancelled' || req.body.orderStatus === 'returned') {
      order.isPaid = false;
    }
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('order_status_change', { orderId: order._id, status: req.body.orderStatus, oldStatus: oldOrderStatus });
    }
    const updated = await order.save();
    logger.admin(req.user.email, 'order_status_change', { orderId: order._id, status: req.body.orderStatus });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status' });
  }
});

router.put('/:id/upi-verify', protect, admin, async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    if (!['verified', 'rejected'].includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.upiPaymentStatus = req.body.status;
    if (req.body.status === 'verified') {
      if (order.isPaid) return res.status(400).json({ message: 'Already paid' });
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
    logger.payment(order._id, 'upi_verified', { status: req.body.status, admin: req.user.email });
    res.json(updated);
  } catch (err) {
    logger.error('UPI verify error', { message: err.message, orderId: req.params.id });
    res.status(500).json({ message: 'Verification failed' });
  }
});

router.put('/:id/upi-retry', protect, async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
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
  } catch (err) {
    res.status(500).json({ message: 'Retry failed' });
  }
});

module.exports = router;
