const fs = require('fs');
const path = require('path');

const LOG_DIR = path.resolve(__dirname, '..', 'logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function appendToFile(filename, data) {
  const line = `${new Date().toISOString()} | ${JSON.stringify(data)}\n`;
  fs.appendFile(path.join(LOG_DIR, filename), line, (err) => {
    if (err) console.error('Log write error:', err.message);
  });
}

const logger = {
  info(event, details = {}) {
    appendToFile('info.log', { event, ...details });
  },

  error(event, details = {}) {
    appendToFile('error.log', { event, ...details });
    console.error(`[ERROR] ${event}:`, details.message || '');
  },

  login(email, success, ip, details = {}) {
    appendToFile('login.log', { email, success, ip, ...details });
  },

  admin(email, action, details = {}) {
    appendToFile('admin.log', { email, action, ...details });
  },

  payment(orderId, event, details = {}) {
    appendToFile('payment.log', { orderId, event, ...details });
  },

  security(event, ip, details = {}) {
    appendToFile('security.log', { event, ip, ...details });
  },

  otp(email, action, ip, details = {}) {
    appendToFile('otp.log', { email, action, ip, ...details });
  },
};

module.exports = logger;
