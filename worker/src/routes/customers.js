import { Hono } from 'hono';
import { find, findOne, updateOne, deleteOne } from '../lib/db.js';
import { protect, adminOnly } from '../lib/middleware.js';
import { sanitizeBody, sanitizeQuery } from '../lib/sanitize.js';

const app = new Hono();

app.get('/', protect, adminOnly, async (c) => {
  try {
    const q = sanitizeQuery(c.req.query());
    const filter = {};
    if (q.search) {
      filter.$or = [
        { name: { $regex: q.search, $options: 'i' } },
        { email: { $regex: q.search, $options: 'i' } },
      ];
    }
    const users = await find('users', { filter, projection: { password: 0 }, sort: { createdAt: -1 } });
    return c.json(users);
  } catch (err) {
    return c.json({ message: err.message }, 500);
  }
});

app.get('/:id', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const user = await findOne('users', { _id: id }, { password: 0 });
    if (!user) return c.json({ message: 'User not found' }, 404);
    const orders = await find('orders', { filter: { user: user._id }, sort: { createdAt: -1 } });
    return c.json({ user, orders });
  } catch (err) {
    return c.json({ message: err.message }, 500);
  }
});

app.put('/:id', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const user = await findOne('users', { _id: id });
    if (!user) return c.json({ message: 'User not found' }, 404);
    const set = {};
    if (body.name) set.name = body.name;
    if (body.email) set.email = body.email;
    if (body.blocked !== undefined) set.blocked = body.blocked;
    if (body.isAdmin !== undefined) set.isAdmin = body.isAdmin;
    set.updatedAt = new Date();
    await updateOne('users', { _id: id }, { $set: set });
    const updated = await findOne('users', { _id: id });
    return c.json({ _id: updated._id, name: updated.name, email: updated.email, isAdmin: !!updated.isAdmin || ['super_admin', 'admin'].includes(updated.role), blocked: updated.blocked });
  } catch (err) {
    return c.json({ message: err.message }, 500);
  }
});

app.delete('/:id', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const res = await deleteOne('users', { _id: id });
    if (!res) return c.json({ message: 'User not found' }, 404);
    return c.json({ message: 'User deleted' });
  } catch (err) {
    return c.json({ message: err.message }, 500);
  }
});

export default app;