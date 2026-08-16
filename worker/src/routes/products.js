import { Hono } from 'hono';
import { find, findOne, insertOne, updateOne, deleteOne, count, distinct } from '../lib/db.js';
import { protect, adminOnly } from '../lib/middleware.js';
import { sanitizeBody, sanitizeQuery, paginate, isValidObjectId } from '../lib/sanitize.js';

const app = new Hono();

function makeSlug(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

app.get('/', async (c) => {
  try {
    const q = sanitizeQuery(c.req.query());
    const { page, limit, skip } = paginate(q.page, 12);
    const filter = { visible: true };
    if (q.keyword) filter.name = { $regex: q.keyword, $options: 'i' };
    if (q.category) filter.category = q.category;
    const total = await count('products', filter);
    const products = await find('products', { filter, sort: { createdAt: -1 }, limit, skip });
    return c.json({ products, page, pages: Math.ceil(total / limit), count: total });
  } catch (err) {
    return c.json({ message: err.message }, 500);
  }
});

app.get('/categories', async (c) => {
  try {
    const cats = await distinct('products', 'category', { visible: true });
    return c.json(cats);
  } catch (err) {
    return c.json({ message: err.message }, 500);
  }
});

app.get('/featured', async (c) => {
  try {
    const products = await find('products', { filter: { featured: true, visible: true }, limit: 8 });
    return c.json(products);
  } catch (err) {
    return c.json({ message: err.message }, 500);
  }
});

app.get('/best-sellers', async (c) => {
  try {
    const products = await find('products', { filter: { bestSeller: true, visible: true }, limit: 8 });
    return c.json(products);
  } catch (err) {
    return c.json({ message: err.message }, 500);
  }
});

app.get('/latest', async (c) => {
  try {
    const products = await find('products', { filter: { visible: true }, sort: { createdAt: -1 }, limit: 8 });
    return c.json(products);
  } catch (err) {
    return c.json({ message: err.message }, 500);
  }
});

app.get('/all', protect, adminOnly, async (c) => {
  try {
    const products = await find('products', { sort: { createdAt: -1 } });
    return c.json(products);
  } catch (err) {
    return c.json({ message: err.message }, 500);
  }
});

app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidObjectId(id)) return c.json({ message: 'Product not found' }, 404);
    const product = await findOne('products', { _id: id });
    if (!product) return c.json({ message: 'Product not found' }, 404);
    return c.json(product);
  } catch (err) {
    return c.json({ message: err.message }, 500);
  }
});

app.post('/', protect, adminOnly, async (c) => {
  try {
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const { name, description, price, salePrice, images, category, tags, size, countInStock, sku, featured, bestSeller, visible } = body;
    if (!name || !description || price == null || !category || countInStock == null) {
      return c.json({ message: 'name, description, price, category, and countInStock are required' }, 400);
    }
    if (typeof price !== 'number' || price <= 0) return c.json({ message: 'price must be a positive number' }, 400);
    if (isNaN(Number(countInStock)) || Number(countInStock) < 0) return c.json({ message: 'countInStock must be a non-negative number' }, 400);
    let slug = makeSlug(name);
    const existing = await findOne('products', { slug });
    if (existing) slug = slug + '-' + Date.now();
    const id = await insertOne('products', {
      name, slug, description, price, salePrice, images: images || [], category, tags: tags || [], size: size || [],
      countInStock, sku, rating: 0, numReviews: 0,
      featured: featured || false, bestSeller: bestSeller || false, visible: visible !== false,
      createdAt: new Date(), updatedAt: new Date(),
    });
    const product = await findOne('products', { _id: id });
    return c.json(product, 201);
  } catch (err) {
    console.error('[PRODUCTS] create error:', err.message);
    return c.json({ message: err.message }, 500);
  }
});

app.put('/:id', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const product = await findOne('products', { _id: id });
    if (!product) return c.json({ message: 'Product not found' }, 404);
    const allowed = ['name', 'description', 'price', 'salePrice', 'images', 'category', 'tags', 'size', 'countInStock', 'sku', 'featured', 'bestSeller', 'visible'];
    const set = {};
    for (const f of allowed) {
      if (body[f] !== undefined) set[f] = body[f];
    }
    if (body.name) {
      let newSlug = makeSlug(body.name);
      const slugExists = await findOne('products', { slug: newSlug, _id: { $ne: id } });
      if (slugExists) newSlug = newSlug + '-' + Date.now();
      set.slug = newSlug;
    }
    set.updatedAt = new Date();
    await updateOne('products', { _id: id }, { $set: set });
    const updated = await findOne('products', { _id: id });
    return c.json(updated);
  } catch (err) {
    console.error('[PRODUCTS] update error:', err.message);
    return c.json({ message: err.message }, 500);
  }
});

app.delete('/:id', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const product = await findOne('products', { _id: id });
    if (!product) return c.json({ message: 'Product not found' }, 404);
    await deleteOne('products', { _id: id });
    return c.json({ message: 'Product removed' });
  } catch (err) {
    return c.json({ message: err.message }, 500);
  }
});

export default app;