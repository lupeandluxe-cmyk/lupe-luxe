import { Hono } from 'hono';
import { findOne, insertOne, updateOne, deleteOne, deleteMany, find } from '../lib/db.js';
import { generateTokenPair, verifyAccessToken, verifyRefreshToken, hashPassword, verifyPassword, recordLoginAttempt, loginLocked, isAdmin, publicUser, sha256Hex } from '../lib/auth.js';
import { protect, adminOnly } from '../lib/middleware.js';
import { sanitizeBody } from '../lib/sanitize.js';
import { sendOtpEmail } from '../lib/email.js';

const app = new Hono();

const PASSWORD_MIN = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}|;':",.<>?/~`]).{8,}$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

function validatePassword(password) {
  if (!password || password.length < PASSWORD_MIN) return 'Password must be at least 8 characters';
  if (!PASSWORD_REGEX.test(password)) return 'Password must include uppercase, lowercase, number, and special character';
  return null;
}

function clientIp(c) {
  return c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
}

app.post('/register', async (c) => {
  try {
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const { name, email, password } = body;
    if (!name || !email || !password) return c.json({ message: 'Name, email, and password are required' }, 400);
    if (!EMAIL_REGEX.test(email)) return c.json({ message: 'Invalid email format' }, 400);
    const pwError = validatePassword(password);
    if (pwError) return c.json({ message: pwError }, 400);
    const nameTrimmed = String(name).trim();
    if (nameTrimmed.length < 2 || nameTrimmed.length > 50) return c.json({ message: 'Name must be between 2 and 50 characters' }, 400);
    const cleanEmail = email.toLowerCase().trim();
    const exists = await findOne('users', { email: cleanEmail });
    if (exists) return c.json({ message: 'User already exists' }, 400);
    const passwordHash = await hashPassword(password);
    const id = await insertOne('users', {
      name: nameTrimmed,
      email: cleanEmail,
      password: passwordHash,
      isAdmin: false,
      role: 'customer',
      blocked: false,
      loginAttempts: 0,
      lockedUntil: null,
      loginHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const user = { _id: id, name: nameTrimmed, email: cleanEmail, isAdmin: false, role: 'customer' };
    const tokens = await generateTokenPair(id);
    return c.json({ ...publicUser(user), ...tokens }, 201);
  } catch (err) {
    console.error('[AUTH] register error:', err.message);
    return c.json({ message: 'Registration failed' }, 500);
  }
});

app.post('/login', async (c) => {
  try {
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const { email, password } = body;
    if (!email || !password) return c.json({ message: 'Email and password are required' }, 400);
    const cleanEmail = email.toLowerCase().trim();
    const user = await findOne('users', { email: cleanEmail });
    if (!user) return c.json({ message: 'Invalid email or password' }, 401);
    const locked = loginLocked(user);
    if (locked) return c.json({ message: locked }, 429);
    const ok = await verifyPassword(password, user.password);
    if (!ok) {
      await updateOne('users', { _id: user._id }, recordLoginAttempt(user, false));
      return c.json({ message: 'Invalid email or password' }, 401);
    }
    await updateOne('users', { _id: user._id }, recordLoginAttempt(user, true));
    await updateOne('users', { _id: user._id }, {
      $push: { loginHistory: { $each: [{ ip: clientIp(c), date: new Date().toISOString() }], $slice: -50 } },
    });
    const tokens = await generateTokenPair(user._id);
    return c.json({ ...publicUser(user), ...tokens });
  } catch (err) {
    console.error('[AUTH] login error:', err.message);
    return c.json({ message: 'Login failed' }, 500);
  }
});

app.post('/send-otp', async (c) => {
  try {
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const { email } = body;
    if (!email || !EMAIL_REGEX.test(email)) return c.json({ message: 'Valid email is required' }, 400);
    const cleanEmail = email.toLowerCase().trim();
    const recent = await findOne('otps', { email: cleanEmail }, {}, { sort: { createdAt: -1 } });
    if (recent && (recent.resendCount || 0) >= 3) {
      return c.json({ message: 'Too many OTP requests. Try again later.' }, 429);
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await sha256Hex(otp);
    await deleteMany('otps', { email: cleanEmail });
    await insertOne('otps', {
      email: cleanEmail,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      resendCount: (recent?.resendCount || 0) + 1,
      lastResendAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    try {
      await sendOtpEmail(cleanEmail, otp);
      return c.json({ message: 'OTP sent to your email' });
    } catch {
      return c.json({ message: 'Failed to send OTP. Try again.' }, 500);
    }
  } catch (err) {
    console.error('[AUTH] send-otp error:', err.message);
    return c.json({ message: 'Failed to send OTP' }, 500);
  }
});

app.post('/verify-otp', async (c) => {
  try {
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const { email, otp } = body;
    if (!email || !otp) return c.json({ message: 'Email and OTP are required' }, 400);
    if (!EMAIL_REGEX.test(email)) return c.json({ message: 'Invalid email format' }, 400);
    const cleanEmail = email.toLowerCase().trim();
    const otpHash = await sha256Hex(String(otp).trim());
    const record = await findOne('otps', { email: cleanEmail, expiresAt: { $gt: new Date() } });
    if (!record) return c.json({ message: 'No OTP found. Request a new one.' }, 400);
    const attempts = (record.attempts || 0) + 1;
    if (attempts > 5) {
      await deleteOne('otps', { _id: record._id });
      return c.json({ message: 'Too many attempts. Request a new OTP.' }, 429);
    }
    if (record.otpHash !== otpHash) {
      await updateOne('otps', { _id: record._id }, { $set: { attempts } });
      return c.json({ message: 'Invalid OTP' }, 400);
    }
    await deleteOne('otps', { _id: record._id });
    let user = await findOne('users', { email: cleanEmail });
    if (!user) {
      const name = cleanEmail.split('@')[0];
      const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const passwordHash = await hashPassword(tempPassword);
      const id = await insertOne('users', {
        name, email: cleanEmail, password: passwordHash, isAdmin: false, role: 'customer',
        blocked: false, loginAttempts: 0, lockedUntil: null, loginHistory: [],
        createdAt: new Date(), updatedAt: new Date(),
      });
      user = { _id: id, name, email: cleanEmail, isAdmin: false, role: 'customer' };
    }
    const tokens = await generateTokenPair(user._id);
    return c.json({ ...publicUser(user), ...tokens });
  } catch (err) {
    console.error('[AUTH] verify-otp error:', err.message);
    return c.json({ message: 'Verification failed' }, 500);
  }
});

app.post('/refresh', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const token = body.refreshToken;
  if (!token) return c.json({ message: 'Refresh token required' }, 400);
  const payload = await verifyRefreshToken(token);
  if (!payload) return c.json({ message: 'Invalid or expired refresh token' }, 401);
  const user = await findOne('users', { _id: payload.id }, { password: 0 });
  if (!user) return c.json({ message: 'User not found' }, 401);
  if (user.blocked) return c.json({ message: 'Account is blocked' }, 403);
  return c.json(await generateTokenPair(user._id));
});

app.post('/logout', protect, (c) => c.json({ message: 'Logged out successfully' }));

app.get('/profile', protect, (c) => {
  const user = c.get('user');
  return c.json(publicUser(user));
});

app.put('/profile', protect, async (c) => {
  try {
    const user = c.get('user');
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const set = {};
    if (body.name) {
      const nameTrimmed = String(body.name).trim();
      if (nameTrimmed.length < 2 || nameTrimmed.length > 50) return c.json({ message: 'Name must be between 2 and 50 characters' }, 400);
      set.name = nameTrimmed;
    }
    if (body.email) {
      if (!EMAIL_REGEX.test(body.email)) return c.json({ message: 'Invalid email format' }, 400);
      const cleanEmail = body.email.toLowerCase().trim();
      const dup = await findOne('users', { email: cleanEmail, _id: { $ne: user._id } });
      if (dup) return c.json({ message: 'Email already in use' }, 400);
      set.email = cleanEmail;
    }
    if (body.password) {
      const pwError = validatePassword(body.password);
      if (pwError) return c.json({ message: pwError }, 400);
      set.password = await hashPassword(body.password);
    }
    if (Object.keys(set).length === 0) return c.json({ message: 'Nothing to update' }, 400);
    set.updatedAt = new Date();
    await updateOne('users', { _id: user._id }, { $set: set });
    const updated = await findOne('users', { _id: user._id }, { password: 0 });
    const tokens = await generateTokenPair(updated._id);
    return c.json({ ...publicUser(updated), ...tokens });
  } catch (err) {
    console.error('[AUTH] profile update error:', err.message);
    return c.json({ message: 'Profile update failed' }, 500);
  }
});

// ── Admin Management ──────────────────────────────────────────────

app.get('/admins', protect, adminOnly, async (c) => {
  try {
    const users = await find('users', { filter: { isAdmin: true }, sort: { createdAt: -1 } });
    return c.json(users.map((u) => ({ _id: u._id, name: u.name, email: u.email, blocked: u.blocked, createdAt: u.createdAt })));
  } catch (err) {
    return c.json({ message: 'Failed to fetch admins' }, 500);
  }
});

app.post('/admins', protect, adminOnly, async (c) => {
  try {
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const { name, email, password } = body;
    if (!name || !email || !password) return c.json({ message: 'Name, email, and password are required' }, 400);
    const nameTrimmed = String(name).trim();
    if (nameTrimmed.length < 2 || nameTrimmed.length > 50) return c.json({ message: 'Name must be between 2 and 50 characters' }, 400);
    if (!EMAIL_REGEX.test(email)) return c.json({ message: 'Invalid email format' }, 400);
    const pwError = validatePassword(password);
    if (pwError) return c.json({ message: pwError }, 400);
    const cleanEmail = email.toLowerCase().trim();
    const exists = await findOne('users', { email: cleanEmail });
    if (exists) return c.json({ message: 'A user with this email already exists' }, 400);
    const passwordHash = await hashPassword(password);
    const id = await insertOne('users', {
      name: nameTrimmed, email: cleanEmail, password: passwordHash, isAdmin: true, role: 'admin',
      blocked: false, loginAttempts: 0, lockedUntil: null, loginHistory: [],
      createdAt: new Date(), updatedAt: new Date(),
    });
    return c.json({ _id: id, name: nameTrimmed, email: cleanEmail, isAdmin: true, blocked: false, createdAt: new Date() }, 201);
  } catch (err) {
    return c.json({ message: 'Failed to create admin' }, 500);
  }
});

app.put('/admins/:id', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const current = c.get('user');
    const target = await findOne('users', { _id: id });
    if (!target) return c.json({ message: 'Admin not found' }, 404);
    if (!isAdmin(target)) return c.json({ message: 'Target user is not an admin' }, 400);
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    if (current._id === target._id) {
      if (body.isAdmin === false) return c.json({ message: 'You cannot remove your own admin status' }, 400);
      if (body.blocked === true) return c.json({ message: 'You cannot block yourself' }, 400);
    }
    const set = {};
    if (body.name !== undefined) {
      const n = String(body.name).trim();
      if (n.length < 2 || n.length > 50) return c.json({ message: 'Name must be between 2 and 50 characters' }, 400);
      set.name = n;
    }
    if (body.blocked !== undefined) set.blocked = body.blocked;
    if (body.isAdmin !== undefined) set.isAdmin = body.isAdmin;
    set.updatedAt = new Date();
    await updateOne('users', { _id: id }, { $set: set });
    const updated = await findOne('users', { _id: id });
    return c.json({ _id: updated._id, name: updated.name, email: updated.email, isAdmin: isAdmin(updated), blocked: updated.blocked, createdAt: updated.createdAt });
  } catch (err) {
    return c.json({ message: 'Failed to update admin' }, 500);
  }
});

app.delete('/admins/:id', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const current = c.get('user');
    if (current._id === id) return c.json({ message: 'You cannot delete yourself' }, 400);
    const target = await findOne('users', { _id: id });
    if (!target) return c.json({ message: 'Admin not found' }, 404);
    if (!isAdmin(target)) return c.json({ message: 'Target user is not an admin' }, 400);
    await deleteOne('users', { _id: id });
    return c.json({ message: 'Admin removed' });
  } catch (err) {
    return c.json({ message: 'Failed to delete admin' }, 500);
  }
});

app.put('/admins/:id/reset-password', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const { password } = body;
    if (!password || password.length < PASSWORD_MIN) return c.json({ message: 'Password must be at least 8 characters' }, 400);
    const target = await findOne('users', { _id: id });
    if (!target) return c.json({ message: 'Admin not found' }, 404);
    if (!isAdmin(target)) return c.json({ message: 'Target user is not an admin' }, 400);
    await updateOne('users', { _id: id }, { $set: { password: await hashPassword(password), updatedAt: new Date() } });
    return c.json({ message: 'Password reset' });
  } catch (err) {
    return c.json({ message: 'Failed to reset password' }, 500);
  }
});

export default app;