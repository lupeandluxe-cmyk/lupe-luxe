const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss');

function sanitizeInput(obj) {
  if (typeof obj === 'string') return xss(obj.trim());
  if (Array.isArray(obj)) return obj.map(sanitizeInput);
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const sanitized = {};
    for (const [k, v] of Object.entries(obj)) {
      sanitized[k] = sanitizeInput(v);
    }
    return sanitized;
  }
  return obj;
}

function xssSanitize(req, res, next) {
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) req.query = sanitizeInput(req.query);
  if (req.params) req.params = sanitizeInput(req.params);
  next();
}

function mongoSanitizeMiddleware(req, res, next) {
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.query);
  mongoSanitize.sanitize(req.params);
  next();
}

function preventParamPollution(req, res, next) {
  hpp({ whitelist: ['page', 'limit', 'sort', 'keyword', 'category', 'price', 'size', 'status', 'folder', 'search'] })(req, res, next);
}

function validateObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

module.exports = { xssSanitize, mongoSanitizeMiddleware, preventParamPollution, sanitizeInput, validateObjectId };
