const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const SiteSetting = require('../models/SiteSetting');
const { protect } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/security');
const logger = require('../services/logger');

const router = express.Router();

const UTR_REGEX = /^[A-Za-z0-9]{8,30}$/;

async function getRazorpaySettings() {
  const settings = await SiteSetting.find({});
  const map = {};
  settings.forEach(s => { map[s.key] = s.value; });
  return {
    key_id: map.razorpayKeyId || process.env.RAZORPAY_KEY_ID || '',
    key_secret: map.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || '',
    testMode: map.razorpayTestMode !== 'false',
  };
}

const getRazorpay = (key_id, key_secret) => new Razorpay({ key_id, key_secret });

router.post('/razorpay', protect, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!validateObjectId(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user?.toString() !== req.user._id.toString()) {
      logger.security('Unauthorized payment attempt', req.ip, { orderId, userId: req.user._id });
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (order.isPaid) {
      return res.status(400).json({ message: 'Order already paid' });
    }

    const rp = await getRazorpaySettings();
    if (!rp.key_id || !rp.key_secret) {
      return res.status(400).json({ message: 'Razorpay not configured' });
    }
    const razorpay = getRazorpay(rp.key_id, rp.key_secret);
    const amount = Math.round(order.totalPrice * 100);
    const options = {
      amount,
      currency: 'INR',
      receipt: `order_${order._id}_${Date.now()}`,
      notes: { orderId: order._id.toString(), userId: req.user._id.toString() },
    };

    const razorpayOrder = await razorpay.orders.create(options);
    logger.payment(order._id, 'razorpay_initiated', { amount, userId: req.user._id });
    res.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    logger.error('Razorpay initiation error', { message: error.message });
    res.status(500).json({ message: 'Payment initiation failed' });
  }
});

router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ message: 'Missing payment verification data' });
    }
    if (!validateObjectId(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const rp = await getRazorpaySettings();
    if (!rp.key_secret) {
      return res.status(400).json({ message: 'Razorpay not configured' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', rp.key_secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      logger.security('Invalid Razorpay signature', req.ip, { orderId, razorpay_payment_id });
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.isPaid) {
      logger.payment(order._id, 'duplicate_verify_attempt', { userId: req.user._id });
      return res.status(400).json({ message: 'Order already paid' });
    }
    if (order.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.orderStatus = 'confirmed';
    order.paymentResult = {
      id: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: 'completed',
    };
    await order.save();

    for (const item of order.items) {
      const Product = require('../models/Product');
      const product = await Product.findById(item.product);
      if (product) {
        product.countInStock = Math.max(0, product.countInStock - item.qty);
        await product.save();
      }
    }

    logger.payment(order._id, 'razorpay_verified', { razorpay_payment_id, userId: req.user._id });
    res.json({ message: 'Payment successful', order });
  } catch (error) {
    logger.error('Payment verify error', { message: error.message });
    res.status(500).json({ message: 'Verification failed' });
  }
});

router.post('/upi', protect, async (req, res) => {
  try {
    const { orderId, upiTransactionId, upiScreenshot } = req.body;
    if (!validateObjectId(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    if (!upiTransactionId || !UTR_REGEX.test(upiTransactionId)) {
      return res.status(400).json({ message: 'Invalid UTR. Must be 8-30 alphanumeric characters.' });
    }
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (order.isPaid) {
      return res.status(400).json({ message: 'Order already paid' });
    }
    if (order.upiPaymentStatus === 'pending') {
      return res.status(400).json({ message: 'UPI payment already submitted. Wait for verification.' });
    }

    order.upiTransactionId = upiTransactionId;
    if (upiScreenshot) order.upiScreenshot = upiScreenshot;
    order.upiPaymentStatus = 'pending';
    order.paymentMethod = 'upi';
    await order.save();

    logger.payment(order._id, 'upi_submitted', { userId: req.user._id });
    res.json({ message: 'UPI payment details submitted. Awaiting verification.', order });
  } catch (err) {
    logger.error('UPI submission error', { message: err.message });
    res.status(500).json({ message: 'UPI submission failed' });
  }
});

router.get('/key', async (req, res) => {
  const rp = await getRazorpaySettings();
  res.json({ key: rp.key_id || '' });
});

module.exports = router;
