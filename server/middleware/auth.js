const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../services/logger');

const ACCESS_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY = '30d';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function generateAccessToken(id) {
  return jwt.sign({ id, type: 'access' }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(id) {
  return jwt.sign({ id, type: 'refresh' }, process.env.JWT_SECRET + '_refresh', { expiresIn: REFRESH_TOKEN_EXPIRY });
}

function generateTokenPair(id) {
  return {
    token: generateAccessToken(id),
    refreshToken: generateRefreshToken(id),
  };
}

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'access') {
      return res.status(401).json({ message: 'Invalid token type' });
    }
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (req.user.blocked) {
      logger.security('Blocked user access attempt', req.ip, { userId: req.user._id });
      return res.status(403).json({ message: 'Account is blocked' });
    }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Refresh token required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET + '_refresh');
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (user.blocked) {
      return res.status(403).json({ message: 'Account is blocked' });
    }
    res.json(generateTokenPair(user._id));
  } catch {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

const checkLoginAttempts = async (email) => {
  const user = await User.findOne({ email }).select('loginAttempts lockedUntil');
  if (!user) return true;
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remaining = Math.ceil((user.lockedUntil - new Date()) / 1000 / 60);
    throw new Error(`Account locked. Try again in ${remaining} minutes`);
  }
  return true;
};

const recordLoginAttempt = async (email, success) => {
  const user = await User.findOne({ email });
  if (!user) return;
  if (success) {
    user.loginAttempts = 0;
    user.lockedUntil = null;
  } else {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
    }
  }
  await user.save();
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    logger.admin(req.user.email, 'route_access', { path: req.originalUrl, ip: req.ip });
    next();
  } else {
    logger.security('Unauthorized admin access attempt', req.ip, { userId: req.user?._id, path: req.originalUrl });
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

module.exports = { protect, admin, generateTokenPair, generateAccessToken, refreshToken, checkLoginAttempts, recordLoginAttempt };
