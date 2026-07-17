const crypto = require('crypto');
const express = require('express');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { protect, admin, generateTokenPair, refreshToken, checkLoginAttempts, recordLoginAttempt } = require('../middleware/auth');
const { sendOtpEmail } = require('../services/email');
const logger = require('../services/logger');

const router = express.Router();

const PASSWORD_MIN = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}|;':",.<>?/~`]).{8,}$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

function validatePassword(password) {
  if (!password || password.length < PASSWORD_MIN) {
    return 'Password must be at least 8 characters';
  }
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must include uppercase, lowercase, number, and special character';
  }
  return null;
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    const pwError = validatePassword(password);
    if (pwError) {
      return res.status(400).json({ message: pwError });
    }
    const nameTrimmed = String(name).trim();
    if (nameTrimmed.length < 2 || nameTrimmed.length > 50) {
      return res.status(400).json({ message: 'Name must be between 2 and 50 characters' });
    }
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      logger.security('Duplicate registration attempt', req.ip, { email });
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create({ name: nameTrimmed, email: email.toLowerCase().trim(), password });
    const tokens = generateTokenPair(user._id);
    logger.login(email, true, req.ip, { action: 'register' });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, ...tokens });
  } catch (err) {
    logger.error('Registration error', { message: err.message, email: req.body?.email });
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    await checkLoginAttempts(email);
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (user && (await user.matchPassword(password))) {
      await recordLoginAttempt(email, true);
      await User.updateOne(
        { _id: user._id },
        { $push: { loginHistory: { $each: [{ ip: req.ip, date: new Date() }], $slice: -50 } } }
      );
      const tokens = generateTokenPair(user._id);
      logger.login(email, true, req.ip, { action: 'login' });
      res.json({ _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, ...tokens });
    } else {
      if (user) await recordLoginAttempt(email, false);
      logger.login(email, false, req.ip, { action: 'login_failed' });
      logger.security('Failed login attempt', req.ip, { email });
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    if (err.message && err.message.startsWith('Account locked')) {
      return res.status(429).json({ message: err.message });
    }
    logger.error('Login error', { message: err.message, email: req.body?.email });
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const recent = await Otp.findOne({ email: cleanEmail }).sort({ createdAt: -1 });
    if (recent && recent.resendCount >= 3) {
      logger.otp(cleanEmail, 'resend_limit', req.ip);
      return res.status(429).json({ message: 'Too many OTP requests. Try again later.' });
    }
    const otp = Otp.generateOtp();
    const otpHash = Otp.hashOtp(otp);
    await Otp.deleteMany({ email: cleanEmail });
    await Otp.create({
      email: cleanEmail,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      resendCount: (recent?.resendCount || 0) + 1,
      lastResendAt: new Date(),
    });
    try {
      await sendOtpEmail(cleanEmail, otp);
      logger.otp(cleanEmail, 'sent', req.ip);
      res.json({ message: 'OTP sent to your email' });
    } catch {
      logger.otp(cleanEmail, 'send_failed', req.ip);
      res.status(500).json({ message: 'Failed to send OTP. Try again.' });
    }
  } catch (err) {
    logger.error('Send OTP error', { message: err.message });
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const otpHash = Otp.hashOtp(String(otp).trim());
    const record = await Otp.findOne({ email: cleanEmail, expiresAt: { $gt: new Date() } });
    if (!record) {
      logger.otp(cleanEmail, 'verify_no_record', req.ip);
      return res.status(400).json({ message: 'No OTP found. Request a new one.' });
    }
    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts > 5) {
      await Otp.deleteOne({ _id: record._id });
      logger.otp(cleanEmail, 'brute_force_blocked', req.ip);
      return res.status(429).json({ message: 'Too many attempts. Request a new OTP.' });
    }
    if (record.otpHash !== otpHash) {
      await record.save();
      logger.otp(cleanEmail, 'verify_wrong', req.ip);
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    await Otp.deleteOne({ _id: record._id });
    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      const name = cleanEmail.split('@')[0];
      const tempPassword = crypto.randomBytes(16).toString('hex');
      user = await User.create({ name, email: cleanEmail, password: tempPassword });
    }
    const tokens = generateTokenPair(user._id);
    logger.otp(cleanEmail, 'verified', req.ip);
    res.json({ _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, ...tokens });
  } catch (err) {
    logger.error('Verify OTP error', { message: err.message });
    res.status(500).json({ message: 'Verification failed' });
  }
});

router.post('/refresh', refreshToken);

router.post('/logout', protect, async (req, res) => {
  logger.login(req.user.email, true, req.ip, { action: 'logout' });
  res.json({ message: 'Logged out successfully' });
});

router.get('/profile', protect, async (req, res) => res.json(req.user));

router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (req.body.name) {
      const nameTrimmed = String(req.body.name).trim();
      if (nameTrimmed.length < 2 || nameTrimmed.length > 50) {
        return res.status(400).json({ message: 'Name must be between 2 and 50 characters' });
      }
      user.name = nameTrimmed;
    }
    if (req.body.email) {
      if (!EMAIL_REGEX.test(req.body.email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      user.email = req.body.email.toLowerCase().trim();
    }
    if (req.body.password) {
      const pwError = validatePassword(req.body.password);
      if (pwError) return res.status(400).json({ message: pwError });
      user.password = req.body.password;
    }
    const updated = await user.save();
    const tokens = generateTokenPair(updated._id);
    logger.info('Profile updated', { userId: updated._id });
    res.json({ _id: updated._id, name: updated.name, email: updated.email, isAdmin: updated.isAdmin, ...tokens });
  } catch (err) {
    logger.error('Profile update error', { message: err.message, userId: req.user._id });
    res.status(500).json({ message: 'Profile update failed' });
  }
});

// ── Admin Management Routes ──────────────────────────────────────────

const adminProjection = '_id name email blocked createdAt lastLogin';

router.get('/admins', protect, admin, async (req, res) => {
  try {
    const admins = await User.find({ isAdmin: true }).select(adminProjection).sort({ createdAt: -1 });
    res.json(admins);
  } catch (err) {
    logger.error('List admins error', { message: err.message });
    res.status(500).json({ message: 'Failed to fetch admins' });
  }
});

router.post('/admins', protect, admin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const nameTrimmed = String(name).trim();
    if (nameTrimmed.length < 2 || nameTrimmed.length > 50) {
      return res.status(400).json({ message: 'Name must be between 2 and 50 characters' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    const pwError = validatePassword(password);
    if (pwError) return res.status(400).json({ message: pwError });
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(400).json({ message: 'A user with this email already exists' });
    const user = await User.create({ name: nameTrimmed, email: email.toLowerCase().trim(), password, isAdmin: true });
    logger.admin(req.user.email, 'admin_created', { createdId: user._id });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, blocked: user.blocked, createdAt: user.createdAt });
  } catch (err) {
    logger.error('Create admin error', { message: err.message });
    res.status(500).json({ message: 'Failed to create admin' });
  }
});

router.put('/admins/:id', protect, admin, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'Admin not found' });
    if (!target.isAdmin) return res.status(400).json({ message: 'Target user is not an admin' });
    if (req.user._id.toString() === target._id.toString()) {
      if (req.body.isAdmin === false) return res.status(400).json({ message: 'You cannot remove your own admin status' });
      if (req.body.blocked === true) return res.status(400).json({ message: 'You cannot block yourself' });
    }
    if (req.body.name !== undefined) {
      const n = String(req.body.name).trim();
      if (n.length < 2 || n.length > 50) return res.status(400).json({ message: 'Name must be between 2 and 50 characters' });
      target.name = n;
    }
    if (req.body.blocked !== undefined) target.blocked = req.body.blocked;
    if (req.body.isAdmin !== undefined) target.isAdmin = req.body.isAdmin;
    const updated = await target.save();
    logger.admin(req.user.email, 'admin_updated', { updatedId: updated._id });
    res.json({ _id: updated._id, name: updated.name, email: updated.email, isAdmin: updated.isAdmin, blocked: updated.blocked, createdAt: updated.createdAt });
  } catch (err) {
    logger.error('Update admin error', { message: err.message });
    res.status(500).json({ message: 'Failed to update admin' });
  }
});

router.delete('/admins/:id', protect, admin, async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete yourself' });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'Admin not found' });
    if (!target.isAdmin) return res.status(400).json({ message: 'Target user is not an admin' });
    await target.deleteOne();
    logger.admin(req.user.email, 'admin_deleted', { deletedId: req.params.id });
    res.json({ message: 'Admin removed' });
  } catch (err) {
    logger.error('Delete admin error', { message: err.message });
    res.status(500).json({ message: 'Failed to delete admin' });
  }
});

router.put('/admins/:id/reset-password', protect, admin, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < PASSWORD_MIN) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'Admin not found' });
    if (!target.isAdmin) return res.status(400).json({ message: 'Target user is not an admin' });
    target.password = password;
    await target.save();
    logger.admin(req.user.email, 'admin_password_reset', { targetId: req.params.id });
    res.json({ message: 'Password reset' });
  } catch (err) {
    logger.error('Reset admin password error', { message: err.message });
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

module.exports = router;
