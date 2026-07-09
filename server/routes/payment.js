const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

const router = express.Router();

const getRazorpay = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

router.post('/razorpay', protect, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const razorpay = getRazorpay();
    const amount = Math.round(order.totalPrice * 100);
    const options = {
      amount,
      currency: 'INR',
      receipt: `order_${order._id}`,
      notes: { orderId: order._id.toString() },
    };

    const razorpayOrder = await razorpay.orders.create(options);
    res.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    console.error('Razorpay error:', error);
    res.status(500).json({ message: 'Payment initiation failed' });
  }
});

router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const order = await Order.findById(orderId);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: razorpay_payment_id,
        orderId: razorpay_order_id,
        status: 'completed',
      };
      await order.save();
      res.json({ message: 'Payment successful', order });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

router.get('/key', (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID || '' });
});

module.exports = router;
