const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, admin, async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const totalSalesArr = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' } } }]);
  const totalSales = totalSalesArr[0]?.total || 0;
  const totalCustomers = await User.countDocuments({ isAdmin: false });
  const totalProducts = await Product.countDocuments();
  const lowStock = await Product.countDocuments({ countInStock: { $lte: 5 } });
  const recentOrders = await Order.find({}).populate('user', 'name').sort({ createdAt: -1 }).limit(5);
  const recentUsers = await User.find({}).select('-password').sort({ createdAt: -1 }).limit(5);

  const revenueByMonth = await Order.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$totalPrice' } } },
    { $sort: { _id: 1 } },
    { $limit: 12 },
  ]);

  res.json({ totalOrders, totalSales, totalCustomers, totalProducts, lowStock, recentOrders, recentUsers, revenueByMonth });
});

router.get('/orders', protect, admin, async (req, res) => {
  const status = req.query.status;
  const filter = status && status !== 'all' ? { orderStatus: status } : {};
  const orders = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 });
  res.json(orders);
});

router.get('/products', protect, admin, async (req, res) => {
  const products = await Product.find({}).sort({ createdAt: -1 });
  res.json(products);
});

module.exports = router;
