const logger = require('../services/logger');

async function verifyTurnstile(req, res, next) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const token = req.body?.turnstileToken || req.body?.captchaToken;

  // Preserve existing behavior until the optional secret is configured.
  if (!secret) return next();
  if (!token) {
    return res.status(400).json({ message: 'Security verification is required' });
  }

  try {
    const params = new URLSearchParams({ secret, response: token });
    if (req.ip) params.append('remoteip', req.ip);
    const response = await fetch('https://challenges.cloudflare.com/turnstile/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const data = await response.json();
    if (!data.success) {
      logger.security('Turnstile verification failed', req.ip, { codes: data['error-codes'] });
      return res.status(403).json({ message: 'Security verification failed' });
    }
    return next();
  } catch (err) {
    logger.error('Turnstile verification error', { message: err.message });
    return res.status(503).json({ message: 'Security verification is unavailable right now' });
  }
}

module.exports = { verifyTurnstile };
