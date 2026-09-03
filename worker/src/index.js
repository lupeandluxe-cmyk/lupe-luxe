import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { setEnv } from './lib/db.js';
import { rateLimit } from './lib/rate-limit.js';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payment.js';
import mediaRoutes from './routes/media.js';
import settingsRoutes from './routes/settings.js';
import homepageRoutes from './routes/homepage.js';
import categoryRoutes from './routes/categories.js';
import couponRoutes from './routes/coupons.js';
import pageRoutes from './routes/pages.js';
import customerRoutes from './routes/customers.js';
import reportRoutes from './routes/reports.js';
import uploadRoutes from './routes/upload.js';
import chatRoutes from './routes/chat.js';
import { seedAll } from './routes/seed.js';
import { ChatRoom } from './chat.js';
import { INDEX_HTML } from './spa-index.js';

export { ChatRoom };

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', async (c, next) => {
  // Security headers (replaces helmet). Static asset requests have no c.res,
  // so they fall through untouched and are served by Workers Static Assets.
  await next();
  if (c.res) {
    c.res.headers.set('X-Content-Type-Options', 'nosniff');
    c.res.headers.set('X-Frame-Options', 'DENY');
    c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.res.headers.set('X-XSS-Protection', '1; mode=block');
  }
});

// Rate limiting (approximation of previous express-rate-limit config)
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many login attempts, try again later' }));
app.use('/api/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: 'Too many registration attempts, try again later' }));
app.use('/api/auth/send-otp', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many OTP requests, try again later' }));
app.use('/api/auth/verify-otp', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many OTP requests, try again later' }));
app.use('/api/payment', rateLimit({ windowMs: 60 * 1000, max: 20, message: 'Too many payment requests, slow down' }));

app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Root handler: perform lazy seeding only on explicit /api/seed (not on boot)
app.post('/api/seed', async (c) => {
  try {
    const seeded = await seedAll(c.env);
    return c.json({ message: 'Seed complete', seeded });
  } catch (err) {
    console.error('[SEED] error:', err.message);
    return c.json({ message: err.message }, 500);
  }
});

app.route('/api/auth', authRoutes);
app.route('/api/products', productRoutes);
app.route('/api/orders', orderRoutes);
app.route('/api/payment', paymentRoutes);
app.route('/api/media', mediaRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/homepage', homepageRoutes);
app.route('/api/categories', categoryRoutes);
app.route('/api/coupons', couponRoutes);
app.route('/api/pages', pageRoutes);
app.route('/api/customers', customerRoutes);
app.route('/api/reports', reportRoutes);
app.route('/api/upload', uploadRoutes);
app.route('/api/chats', chatRoutes);

// WebSocket chat endpoint — handled by ChatRoom DO via wrangler binding
app.get('/ws/chat/:chatId', (c) => {
  const id = c.env.CHAT_ROOM.idFromName(c.req.param('chatId'));
  const stub = c.env.CHAT_ROOM.get(id);
  const url = new URL(c.req.url);
  return stub.fetch(new Request(url.toString(), c.req.raw));
});

app.onError((err, c) => {
  console.error('[WORKER] error:', err.message);
  console.error('[WORKER] stack:', err.stack);
  return c.json({ message: 'Internal server error' }, 500);
});

// Let unmatched routes fall through to Workers Static Assets (SPA index.html)
// Non-API paths are handled in the fetch wrapper below; hono never sees them.

export default {
  fetch: async (request, env) => {
    setEnv(env);
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api') && !url.pathname.startsWith('/ws')) {
      if (env.ASSETS) return env.ASSETS.fetch(request); // production: static assets + SPA fallback
      if (/\.[a-z0-9]+$/i.test(url.pathname)) return new Response('Not found', { status: 404 });
      return new Response(INDEX_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    return app.fetch(request, env);
  },
  ChatRoom,
};