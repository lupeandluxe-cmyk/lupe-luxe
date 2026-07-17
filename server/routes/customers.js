const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, admin, async (req, res) => {
  try {
    const search = req.query.search
      ? { $or: [{ name: { $regex: req.query.search, $options: 'i' } }, { email: { $regex: req.query.search, $options: 'i' } }] }
      : {};
    const users = await User.find({ ...search }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 });
      res.json({ user, orders });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      if (req.body.name) user.name = req.body.name;
      if (req.body.email) user.email = req.body.email;
      if (req.body.blocked !== undefined) user.blocked = req.body.blocked;
      if (req.body.isAdmin !== undefined) user.isAdmin = req.body.isAdmin;
      const updated = await user.save();
      res.json({ _id: updated._id, name: updated.name, email: updated.email, isAdmin: updated.isAdmin, blocked: updated.blocked });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
