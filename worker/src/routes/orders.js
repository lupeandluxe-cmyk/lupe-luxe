import { Hono } from 'hono';
import { find, findOne, insertOne, updateOne, deleteOne, updateMany } from '../lib/db.js';
import { protect, adminOnly } from '../lib/middleware.js';
import { sanitizeBody, isValidObjectId } from '../lib/sanitize.js';
import { sendOrderEmail } from '../lib/email.js';

const app = new Hono();

app.post('/', protect, async (c) => {
  try {
    const user = c.get('user');
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const { items, shippingAddress, paymentMethod, itemsPrice, discount, couponCode, totalPrice, upiTransactionId, upiScreenshot } = body;

    if (!items || !Array.isArray(items) || items.length === 0) return c.json({ message: 'No order items' }, 400);
    if (!shippingAddress?.fullName || !shippingAddress?.address || !shippingAddress?.city) return c.json({ message: 'Shipping address is required' }, 400);
    if (!['cod', 'razorpay', 'upi'].includes(paymentMethod)) return c.json({ message: 'Invalid payment method' }, 400);
    if (typeof totalPrice !== 'number' || totalPrice <= 0) return c.json({ message: 'Invalid total price' }, 400);

    for (const item of items) {
      if (!item.product || !item.qty || !item.price) return c.json({ message: 'Invalid item data' }, 400);
      if (!isValidObjectId(item.product)) return c.json({ message: 'Invalid product ID' }, 400);
    }

    if (couponCode) {
      const coupon = await findOne('coupons', { code: String(couponCode).toUpperCase().trim(), active: true });
      if (coupon) {
        await updateOne('coupons', { _id: coupon._id }, { $inc: { usedCount: 1 } });
      }
    }

    if (paymentMethod !== 'upi') {
      for (const item of items) {
        const product = await findOne('products', { _id: item.product });
        if (product) {
          if (product.countInStock < item.qty) return c.json({ message: `Insufficient stock for ${product.name}` }, 400);
          await updateOne('products', { _id: item.product }, { $set: { countInStock: Math.max(0, product.countInStock - item.qty), updatedAt: new Date() } });
        }
      }
    }

    const orderData = {
      user: user._id,
      items,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      discount: discount || 0,
      couponCode: couponCode || undefined,
      shippingPrice: 0,
      taxPrice: 0,
      totalPrice,
      upiTransactionId: upiTransactionId || undefined,
      upiScreenshot: upiScreenshot || undefined,
      upiPaymentStatus: paymentMethod === 'upi' ? 'pending' : undefined,
      orderStatus: paymentMethod === 'cod' ? 'confirmed' : 'pending',
      isPaid: false,
      isDelivered: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const id = await insertOne('orders', orderData);
    const order = await findOne('orders', { _id: id });

    sendOrderEmail(order).catch((err) => console.error('[ORDERS] email failed:', err.message));
    return c.json(order, 201);
  } catch (err) {
    console.error('[ORDERS] create error:', err.message);
    return c.json({ message: 'Order creation failed' }, 500);
  }
});

app.get('/mine', protect, async (c) => {
  try {
    const user = c.get('user');
    const orders = await find('orders', { filter: { user: user._id }, sort: { createdAt: -1 } });
    return c.json(orders);
  } catch (err) {
    return c.json({ message: 'Failed to fetch orders' }, 500);
  }
});

app.get('/:id', protect, async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidObjectId(id)) return c.json({ message: 'Invalid order ID' }, 400);
    const user = c.get('user');
    const order = await findOne('orders', { _id: id });
    if (!order) return c.json({ message: 'Order not found' }, 404);
    if (!adminOnly && !user.isAdmin && String(order.user) !== String(user._id)) {
      if (!(user.isAdmin || ['super_admin', 'admin'].includes(user.role))) {
        return c.json({ message: 'Not authorized' }, 403);
      }
    }
    if (user.isAdmin || ['super_admin', 'admin'].includes(user.role)) {
      const owner = await findOne('users', { _id: order.user }, { name: 1, email: 1 });
      order.user = owner || order.user;
    }
    return c.json(order);
  } catch (err) {
    return c.json({ message: 'Failed to fetch order' }, 500);
  }
});

app.put('/:id/pay', protect, async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidObjectId(id)) return c.json({ message: 'Invalid order ID' }, 400);
    const user = c.get('user');
    const order = await findOne('orders', { _id: id });
    if (!order) return c.json({ message: 'Order not found' }, 404);
    if (String(order.user) !== String(user._id) && !(user.isAdmin || ['super_admin', 'admin'].includes(user.role))) {
      return c.json({ message: 'Not authorized' }, 403);
    }
    if (order.isPaid) return c.json({ message: 'Order already paid' }, 400);
    await updateOne('orders', { _id: id }, { $set: { isPaid: true, paidAt: new Date(), updatedAt: new Date() } });
    const updated = await findOne('orders', { _id: id });
    return c.json(updated);
  } catch (err) {
    return c.json({ message: 'Payment update failed' }, 500);
  }
});

app.get('/', protect, adminOnly, async (c) => {
  try {
    const orders = await find('orders', { sort: { createdAt: -1 } });
    return c.json(orders);
  } catch (err) {
    return c.json({ message: 'Failed to fetch orders' }, 500);
  }
});

app.put('/:id/deliver', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidObjectId(id)) return c.json({ message: 'Invalid order ID' }, 400);
    const order = await findOne('orders', { _id: id });
    if (!order) return c.json({ message: 'Order not found' }, 404);
    if (order.isDelivered) return c.json({ message: 'Already delivered' }, 400);
    await updateOne('orders', { _id: id }, { $set: { isDelivered: true, deliveredAt: new Date(), updatedAt: new Date() } });
    const updated = await findOne('orders', { _id: id });
    return c.json(updated);
  } catch (err) {
    return c.json({ message: 'Failed to update delivery' }, 500);
  }
});

app.put('/:id/status', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidObjectId(id)) return c.json({ message: 'Invalid order ID' }, 400);
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
    if (!allowedStatuses.includes(body.orderStatus)) return c.json({ message: 'Invalid order status' }, 400);
    const order = await findOne('orders', { _id: id });
    if (!order) return c.json({ message: 'Order not found' }, 404);
    const set = { orderStatus: body.orderStatus, updatedAt: new Date() };
    if (body.trackingNumber) set.trackingNumber = String(body.trackingNumber).trim();
    if (body.orderStatus === 'delivered') {
      set.isDelivered = true;
      set.deliveredAt = new Date();
    }
    if (body.orderStatus === 'cancelled' || body.orderStatus === 'returned') {
      set.isPaid = false;
    }
    await updateOne('orders', { _id: id }, { $set: set });
    const updated = await findOne('orders', { _id: id });
    return c.json(updated);
  } catch (err) {
    return c.json({ message: 'Failed to update status' }, 500);
  }
});

app.put('/:id/upi-verify', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidObjectId(id)) return c.json({ message: 'Invalid order ID' }, 400);
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    if (!['verified', 'rejected'].includes(body.status)) return c.json({ message: 'Invalid verification status' }, 400);
    const order = await findOne('orders', { _id: id });
    if (!order) return c.json({ message: 'Order not found' }, 404);
    const set = { upiPaymentStatus: body.status, updatedAt: new Date() };
    if (body.status === 'verified') {
      if (order.isPaid) return c.json({ message: 'Already paid' }, 400);
      set.isPaid = true;
      set.paidAt = new Date();
      set.orderStatus = 'confirmed';
      for (const item of order.items || []) {
        const product = await findOne('products', { _id: item.product });
        if (product) {
          await updateOne('products', { _id: item.product }, { $set: { countInStock: Math.max(0, product.countInStock - item.qty), updatedAt: new Date() } });
        }
      }
    }
    if (body.status === 'rejected') {
      set.isPaid = false;
    }
    await updateOne('orders', { _id: id }, { $set: set });
    const updated = await findOne('orders', { _id: id });
    return c.json(updated);
  } catch (err) {
    return c.json({ message: 'Verification failed' }, 500);
  }
});

app.put('/:id/upi-retry', protect, async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidObjectId(id)) return c.json({ message: 'Invalid order ID' }, 400);
    const user = c.get('user');
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const order = await findOne('orders', { _id: id });
    if (!order) return c.json({ message: 'Order not found' }, 404);
    if (String(order.user) !== String(user._id)) return c.json({ message: 'Not authorized' }, 403);
    if (order.upiPaymentStatus !== 'rejected') return c.json({ message: 'Can only retry after rejection' }, 400);
    const set = { upiTransactionId: body.upiTransactionId, upiPaymentStatus: 'pending', updatedAt: new Date() };
    if (body.upiScreenshot) set.upiScreenshot = body.upiScreenshot;
    await updateOne('orders', { _id: id }, { $set: set });
    const updated = await findOne('orders', { _id: id });
    return c.json(updated);
  } catch (err) {
    return c.json({ message: 'Retry failed' }, 500);
  }
});

export default app;