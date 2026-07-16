require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const { execSync } = require('child_process');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { seedAll } = require('./routes/seed');
const setupSocket = require('./socket');
const { xssSanitize, mongoSanitizeMiddleware, preventParamPollution } = require('./middleware/security');
const logger = require('./services/logger');

const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === 'production';

const jwt = require('jsonwebtoken');

const io = new Server(server, {
  cors: {
    origin: isProduction ? process.env.CLIENT_URL || true : '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type === 'access') {
        socket.data.userId = decoded.id;
        socket.data.authenticated = true;
      }
    } catch {}
  }
  next();
});

app.set('io', io);

// --- Trust proxy for rate limiting behind reverse proxy ---
app.set('trust proxy', 1);

// --- Security Headers (Helmet) ---
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://checkout.razorpay.com', 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com', 'https://images.unsplash.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'https://api.razorpay.com'],
      frameSrc: ["'self'", 'https://api.razorpay.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: isProduction ? [] : null,
    },
  } : false,
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: {
    features: {
      camera: ["'none'"],
      microphone: ["'none'"],
      geolocation: ["'none'"],
      payment: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// --- HTTPS redirect in production ---
if (isProduction) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https' && req.headers['x-forwarded-proto'] !== undefined) {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// --- Compression ---
app.use(compression({ level: 6, threshold: 1024 }));

// --- CORS ---
app.use(cors({
  origin: isProduction ? (process.env.CLIENT_URL || '*') : '*',
  credentials: true,
}));

// --- Body parsing with size limits ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// --- Security middleware (order: sanitize → mongo → pollution) ---
app.use(xssSanitize);
app.use(mongoSanitizeMiddleware);
app.use(preventParamPollution);

// --- Rate Limiters ---
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: 'Too many registration attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many OTP requests, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many payment requests, slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many admin requests, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Apply general rate limiter to all API routes ---
app.use('/api', generalLimiter);

// --- Apply specific rate limiters ---
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', signupLimiter);
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/verify-otp', otpLimiter);
app.use('/api/payment', paymentLimiter);
app.use('/api/admin', adminLimiter);
app.use('/api/customers', adminLimiter);
app.use('/api/reports', adminLimiter);

// --- Routes ---
async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error('FATAL: MongoDB connection failed:', err.message);
    console.error('Check that MONGO_URI is set correctly in environment variables.');
    console.error('Also verify MongoDB Atlas IP whitelist includes Render\'s IP range (0.0.0.0/0).');
    process.exit(1);
  }

  // --- Verify Cloudinary configuration ---
  console.log('========== CLOUDINARY CONFIG CHECK ==========');
  console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'SET [' + process.env.CLOUDINARY_CLOUD_NAME + ']' : 'MISSING');
  console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'SET [' + process.env.CLOUDINARY_API_KEY?.substring(0, 4) + '...]' : 'MISSING');
  console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'SET [' + process.env.CLOUDINARY_API_SECRET?.substring(0, 4) + '...]' : 'MISSING');
  const cloudinaryCheck = require('./config/cloudinary');
  console.log('cloudinary.config() loaded:', cloudinaryCheck.config()?.cloud_name || 'NOT CONFIGURED');
  console.log('=============================================');

  const seeded = await seedAll();
  if (Object.keys(seeded).length) {
    console.log('Seeded:', JSON.stringify(seeded));
  }

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/products', require('./routes/products'));
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/payment', require('./routes/payment'));
  app.use('/api/media', require('./routes/media'));
  app.use('/api/settings', require('./routes/settings'));
  app.use('/api/homepage', require('./routes/homepage'));
  app.use('/api/categories', require('./routes/categories'));
  app.use('/api/coupons', require('./routes/coupons'));
  app.use('/api/pages', require('./routes/pages'));
  app.use('/api/customers', require('./routes/customers'));
  app.use('/api/reports', require('./routes/reports'));
  app.use('/api/seed', require('./routes/seed').router);
  app.use('/api/upload', require('./routes/upload'));
  app.use('/api/chats', require('./routes/chat'));
  app.use('/api/internal', require('./routes/internal'));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  setupSocket(io);

  // --- Serve React frontend ---
  const clientDir = path.resolve(__dirname, '..', 'client');
  const clientDist = path.join(clientDir, 'dist');

  if (!fs.existsSync(path.join(clientDist, 'index.html'))) {
    console.log('Building React frontend...');
    try {
      if (!fs.existsSync(path.join(clientDir, 'node_modules'))) {
        execSync('npm install', { cwd: clientDir, stdio: 'pipe' });
      }
      execSync('npm run build', { cwd: clientDir, stdio: 'pipe' });
      console.log('React frontend built');
    } catch (err) {
      console.error('Build failed:', err.message);
    }
  }

  if (fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist, {
      maxAge: '7d',
      etag: true,
      lastModified: true,
    }));
    app.get('*', (req, res) =>
      res.sendFile(path.join(clientDist, 'index.html'))
    );
  } else {
    console.log('API-only mode');
    app.get('/', (req, res) => res.send('Lupe & Luxe API'));
  }

  // --- Global error handler (no stack traces in production) ---
  app.use((err, req, res, _next) => {
    const status = err.status || 500;
    const message = isProduction ? 'Internal server error' : err.message;
    logger.error('Unhandled error', { message: err.message, stack: isProduction ? undefined : err.stack, path: req.originalUrl, ip: req.ip });
    res.status(status).json({
      message,
      ...(isProduction ? {} : { stack: err.stack }),
    });
  });

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch((err) => {
  console.error('FATAL: Server startup failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
