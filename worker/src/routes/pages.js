import { Hono } from 'hono';
import { find, findOne, insertOne, updateOne, deleteOne } from '../lib/db.js';
import { protect, adminOnly } from '../lib/middleware.js';
import { sanitizeBody } from '../lib/sanitize.js';

const app = new Hono();

function makeSlug(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

app.get('/:slug', async (c) => {
  try {
    const slug = String(c.req.param('slug')).trim();
    const page = await findOne('pages', { slug, published: true });
    if (page) return c.json(page);
    return c.json({ message: 'Page not found' }, 404);
  } catch {
    return c.json({ message: 'Failed to fetch page' }, 500);
  }
});

app.get('/', protect, adminOnly, async (c) => {
  try {
    const pages = await find('pages', { sort: { createdAt: -1 } });
    return c.json(pages);
  } catch {
    return c.json({ message: 'Failed to fetch pages' }, 500);
  }
});

app.post('/', protect, adminOnly, async (c) => {
  try {
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const { title, content, slug, metaTitle, metaDescription } = body;
    if (!title) return c.json({ message: 'Title is required' }, 400);
    const pageSlug = slug
      ? makeSlug(slug)
      : makeSlug(title);
    const id = await insertOne('pages', {
      title: String(title).trim(),
      content: content || '',
      slug: pageSlug,
      metaTitle: metaTitle ? String(metaTitle).trim() : undefined,
      metaDescription: metaDescription ? String(metaDescription).trim() : undefined,
      published: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const page = await findOne('pages', { _id: id });
    return c.json(page, 201);
  } catch (err) {
    return c.json({ message: 'Failed to create page' }, 500);
  }
});

app.put('/:id', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const allowed = ['title', 'content', 'metaTitle', 'metaDescription', 'published'];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    updates.updatedAt = new Date();
    const res = await updateOne('pages', { _id: id }, { $set: updates });
    if (!res.matchedCount) return c.json({ message: 'Page not found' }, 404);
    const page = await findOne('pages', { _id: id });
    return c.json(page);
  } catch {
    return c.json({ message: 'Failed to update page' }, 500);
  }
});

app.delete('/:id', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const res = await deleteOne('pages', { _id: id });
    if (!res) return c.json({ message: 'Page not found' }, 404);
    return c.json({ message: 'Page deleted' });
  } catch {
    return c.json({ message: 'Failed to delete page' }, 500);
  }
});

export default app;