const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, admin, async (req, res) => {
  try {
    const [
      totalOrders,
      totalSalesArr,
      totalCustomers,
      totalProducts,
      lowStock,
      recentOrders,
      recentUsers,
      revenueByMonth,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
      User.countDocuments({ isAdmin: false }),
      Product.countDocuments(),
      Product.countDocuments({ countInStock: { $lte: 5 } }),
      Order.find({}).populate('user', 'name').sort({ createdAt: -1 }).limit(5).lean(),
      User.find({}).select('-password').sort({ createdAt: -1 }).limit(5).lean(),
      Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$totalPrice' } } },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
    ]);
    const totalSales = totalSalesArr[0]?.total || 0;
    res.json({ totalOrders, totalSales, totalCustomers, totalProducts, lowStock, recentOrders, recentUsers, revenueByMonth });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/orders', protect, admin, async (req, res) => {
  try {
    const status = req.query.status;
    const filter = status && status !== 'all' ? { orderStatus: status } : {};
    const orders = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/products', protect, admin, async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
