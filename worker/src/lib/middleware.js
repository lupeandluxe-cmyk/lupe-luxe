import { findOne } from '../lib/db.js';
import { verifyAccessToken, isAdmin } from '../lib/auth.js';

// Attach user to context from Authorization header.
export async function protect(c, next) {
  const header = c.req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return c.json({ message: 'Not authorized, no token' }, 401);
  const payload = await verifyAccessToken(token);
  if (!payload) return c.json({ message: 'Not authorized, token failed' }, 401);
  const user = await findOne('users', { _id: payload.id }, { password: 0, twoFactorSecret: 0 });
  if (!user) return c.json({ message: 'User not found' }, 401);
  if (user.blocked) return c.json({ message: 'Account is blocked' }, 403);
  c.set('user', user);
  await next();
}

// Requires admin role.
export async function adminOnly(c, next) {
  const user = c.get('user');
  if (!user) return c.json({ message: 'Not authorized as admin' }, 403);
  if (!isAdmin(user)) return c.json({ message: 'Not authorized as admin' }, 403);
  await next();
}
