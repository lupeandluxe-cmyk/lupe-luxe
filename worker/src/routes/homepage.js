import { Hono } from 'hono';
import { find, findOne, insertOne, updateOne, deleteOne } from '../lib/db.js';
import { protect, adminOnly } from '../lib/middleware.js';
import { sanitizeBody } from '../lib/sanitize.js';

const app = new Hono();

const ALLOWED_TYPES = ['hero', 'banner', 'featured', 'collection', 'testimonial', 'promo', 'newsletter', 'announcement'];
const ALLOWED_FIELDS = ['section', 'type', 'title', 'subtitle', 'text', 'image', 'video', 'buttonText', 'buttonLink', 'images', 'items', 'order', 'active'];

app.get('/', async (c) => {
  try {
    const sections = await find('homepagesections', { filter: { active: true }, sort: { order: 1 } });
    return c.json(sections);
  } catch {
    return c.json({ message: 'Failed to load homepage' }, 500);
  }
});

app.get('/all', protect, adminOnly, async (c) => {
  try {
    const sections = await find('homepagesections', { sort: { order: 1 } });
    return c.json(sections);
  } catch {
    return c.json({ message: 'Failed to load homepage' }, 500);
  }
});

app.post('/', protect, adminOnly, async (c) => {
  try {
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const data = {};
    for (const key of ALLOWED_FIELDS) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    if (!data.type) return c.json({ message: 'Section type is required' }, 400);
    if (!ALLOWED_TYPES.includes(data.type)) return c.json({ message: 'Invalid section type' }, 400);
    const id = await insertOne('homepagesections', { ...data, createdAt: new Date(), updatedAt: new Date() });
    const section = await findOne('homepagesections', { _id: id });
    return c.json(section, 201);
  } catch (err) {
    return c.json({ message: 'Failed to create section' }, 500);
  }
});

app.put('/:id', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const updates = {};
    for (const key of ALLOWED_FIELDS) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    updates.updatedAt = new Date();
    const res = await updateOne('homepagesections', { _id: id }, { $set: updates });
    if (!res.matchedCount) return c.json({ message: 'Section not found' }, 404);
    const section = await findOne('homepagesections', { _id: id });
    return c.json(section);
  } catch {
    return c.json({ message: 'Failed to update section' }, 500);
  }
});

app.delete('/:id', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const res = await deleteOne('homepagesections', { _id: id });
    if (!res) return c.json({ message: 'Section not found' }, 404);
    return c.json({ message: 'Section deleted' });
  } catch {
    return c.json({ message: 'Failed to delete section' }, 500);
  }
});

export default app;