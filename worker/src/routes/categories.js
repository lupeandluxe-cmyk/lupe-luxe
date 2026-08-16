import { Hono } from 'hono';
import { find, findOne, insertOne, updateOne, deleteOne } from '../lib/db.js';
import { protect, adminOnly } from '../lib/middleware.js';
import { sanitizeBody } from '../lib/sanitize.js';

const app = new Hono();

function makeSlug(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

app.get('/', async (c) => {
  try {
    const categories = await find('categories', { filter: { active: true }, sort: { order: 1 } });
    return c.json(categories);
  } catch {
    return c.json({ message: 'Failed to fetch categories' }, 500);
  }
});

app.get('/all', protect, adminOnly, async (c) => {
  try {
    const categories = await find('categories', { sort: { order: 1 } });
    return c.json(categories);
  } catch {
    return c.json({ message: 'Failed to fetch categories' }, 500);
  }
});

app.post('/', protect, adminOnly, async (c) => {
  try {
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const { name, description, image, parent, order } = body;
    if (!name) return c.json({ message: 'Category name is required' }, 400);
    const slug = makeSlug(name);
    const id = await insertOne('categories', {
      name: String(name).trim(),
      slug,
      description: description ? String(description).trim() : undefined,
      image: image || undefined,
      parent: parent || undefined,
      order: Number(order) || 0,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const category = await findOne('categories', { _id: id });
    return c.json(category, 201);
  } catch (err) {
    return c.json({ message: 'Failed to create category' }, 500);
  }
});

app.put('/:id', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const allowed = ['name', 'description', 'image', 'parent', 'order', 'active'];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    updates.updatedAt = new Date();
    const res = await updateOne('categories', { _id: id }, { $set: updates });
    if (!res.matchedCount) return c.json({ message: 'Category not found' }, 404);
    const category = await findOne('categories', { _id: id });
    return c.json(category);
  } catch (err) {
    return c.json({ message: 'Failed to update category' }, 500);
  }
});

app.delete('/:id', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const res = await deleteOne('categories', { _id: id });
    if (!res) return c.json({ message: 'Category not found' }, 404);
    return c.json({ message: 'Category deleted' });
  } catch {
    return c.json({ message: 'Failed to delete category' }, 500);
  }
});

export default app;