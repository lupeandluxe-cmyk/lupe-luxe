import { Hono } from 'hono';
import { find, findOne, insertOne, updateOne, deleteOne } from '../lib/db.js';
import { protect, adminOnly } from '../lib/middleware.js';
import { sanitizeBody, sanitizeQuery } from '../lib/sanitize.js';

const app = new Hono();

app.get('/', protect, adminOnly, async (c) => {
  try {
    const q = sanitizeQuery(c.req.query());
    const filter = {};
    if (q.search) filter.code = { $regex: String(q.search).toUpperCase(), $options: 'i' };
    if (q.type) filter.type = q.type;
    if (q.active === 'true') filter.active = true;
    else if (q.active === 'false') filter.active = false;
    const coupons = await find('coupons', { filter, sort: { createdAt: -1 } });
    return c.json(coupons);
  } catch (err) {
    return c.json({ message: err.message }, 500);
  }
});

app.post('/validate', async (c) => {
  try {
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const { code, orderTotal } = body;
    const cleanCode = String(code || '').toUpperCase().trim();
    const coupon = await findOne('coupons', { code: cleanCode, active: true });
    if (!coupon) return c.json({ valid: false, message: 'Invalid coupon code' }, 400);
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return c.json({ valid: false, message: 'This coupon has expired' }, 400);
    }
    if (coupon.maxUses && (coupon.usedCount || 0) >= coupon.maxUses) {
      return c.json({ valid: false, message: 'This coupon has reached its usage limit' }, 400);
    }
    if (orderTotal < coupon.minOrder) {
      return c.json({ valid: false, message: `Minimum order amount is ₹${coupon.minOrder}` }, 400);
    }
    let discount = 0;
    if (coupon.type === 'free_shipping') {
      discount = 0;
    } else if (coupon.type === 'percentage') {
      discount = Math.round((orderTotal * coupon.discount) / 10000) * 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.discount;
    }
    discount = Math.max(0, Math.round(discount * 100) / 100);
    return c.json({ valid: true, discount, code: coupon.code, type: coupon.type });
  } catch (err) {
    return c.json({ valid: false, message: err.message }, 500);
  }
});

app.post('/', protect, adminOnly, async (c) => {
  try {
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const data = { ...body };
    if (!data.code || !String(data.code).trim()) return c.json({ message: 'Coupon code is required' }, 400);
    if (data.discount === undefined || data.discount === '' || isNaN(Number(data.discount))) {
      return c.json({ message: 'Valid discount is required' }, 400);
    }
    data.code = String(data.code).toUpperCase().trim();
    data.discount = Number(data.discount);
    if (data.minOrder !== undefined && data.minOrder !== '') data.minOrder = Number(data.minOrder);
    if (data.maxDiscount !== undefined && data.maxDiscount !== '') data.maxDiscount = Number(data.maxDiscount);
    if (data.maxUses !== undefined && data.maxUses !== '') data.maxUses = Number(data.maxUses);
    if (data.perUserLimit !== undefined && data.perUserLimit !== '') data.perUserLimit = Number(data.perUserLimit);
    if (!data.expiresAt) delete data.expiresAt;
    const existing = await findOne('coupons', { code: data.code });
    if (existing) return c.json({ message: 'Coupon code already exists' }, 400);
    const id = await insertOne('coupons', { ...data, usedCount: 0, createdAt: new Date(), updatedAt: new Date() });
    const coupon = await findOne('coupons', { _id: id });
    return c.json(coupon, 201);
  } catch (err) {
    console.error('[COUPONS] create error:', err.message);
    return c.json({ message: err.message }, 500);
  }
});

app.put('/:id', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const data = { ...body };
    if (data.code) data.code = String(data.code).toUpperCase().trim();
    if (data.discount !== undefined && data.discount !== '') data.discount = Number(data.discount);
    else delete data.discount;
    if (data.minOrder !== undefined && data.minOrder !== '') data.minOrder = Number(data.minOrder);
    else delete data.minOrder;
    if (data.maxDiscount !== undefined && data.maxDiscount !== '') data.maxDiscount = Number(data.maxDiscount);
    else delete data.maxDiscount;
    if (data.maxUses !== undefined && data.maxUses !== '') data.maxUses = Number(data.maxUses);
    else delete data.maxUses;
    if (data.perUserLimit !== undefined && data.perUserLimit !== '') data.perUserLimit = Number(data.perUserLimit);
    else delete data.perUserLimit;
    if (!data.expiresAt) delete data.expiresAt;
    data.updatedAt = new Date();
    const res = await updateOne('coupons', { _id: id }, { $set: data });
    if (!res.matchedCount) return c.json({ message: 'Coupon not found' }, 404);
    const coupon = await findOne('coupons', { _id: id });
    return c.json(coupon);
  } catch (err) {
    console.error('[COUPONS] update error:', err.message);
    return c.json({ message: err.message }, 500);
  }
});

app.delete('/:id', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const res = await deleteOne('coupons', { _id: id });
    if (!res) return c.json({ message: 'Coupon not found' }, 404);
    return c.json({ message: 'Coupon deleted' });
  } catch (err) {
    return c.json({ message: err.message }, 500);
  }
});

export default app;