const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { protect } = require('../middleware/auth');
const { sendOtpEmail } = require('../services/email');

const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'User already exists' });
  const user = await User.create({ name, email, password });
  res.status(201).json({
    _id: user._id, name: user.name, email: user.email,
    isAdmin: user.isAdmin, token: generateToken(user._id),
  });
});

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await Otp.deleteMany({ email });
  await Otp.create({ email, otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });
  try {
    await sendOtpEmail(email, otp);
    res.json({ message: 'OTP sent to your email' });
  } catch {
    res.status(500).json({ message: 'Failed to send OTP. Try again.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });
  const record = await Otp.findOne({ email, otp, expiresAt: { $gt: new Date() } });
  if (!record) return res.status(400).json({ message: 'Invalid or expired OTP' });
  await Otp.deleteOne({ _id: record._id });
  let user = await User.findOne({ email });
  if (!user) {
    const name = email.split('@')[0];
    user = await User.create({ name, email, password: Math.random().toString(36).slice(-10) });
  }
  res.json({
    _id: user._id, name: user.name, email: user.email,
    isAdmin: user.isAdmin, token: generateToken(user._id),
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id, name: user.name, email: user.email,
      isAdmin: user.isAdmin, token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

router.get('/profile', protect, async (req, res) => res.json(req.user));

router.put('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) user.password = req.body.password;
    const updated = await user.save();
    res.json({
      _id: updated._id, name: updated.name, email: updated.email,
      isAdmin: updated.isAdmin, token: generateToken(updated._id),
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

module.exports = router;
