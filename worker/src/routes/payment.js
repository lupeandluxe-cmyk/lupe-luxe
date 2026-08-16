import { Hono } from 'hono';
import { find, findOne, updateOne } from '../lib/db.js';
import { protect } from '../lib/middleware.js';
import { sanitizeBody, isValidObjectId } from '../lib/sanitize.js';
import { hmacSha256Hex } from '../lib/auth.js';

const app = new Hono();

const UTR_REGEX = /^[A-Za-z0-9]{8,30}$/;

function envVar(name) {
  return globalThis.__ENV__?.[name] || process?.env?.[name] || '';
}

async function getSettingsMap() {
  const settings = await find('sitesettings');
  const map = {};
  settings.forEach((s) => { map[s.key] = s.value; });
  return map;
}

function basicAuth(keyId, keySecret) {
  return 'Basic ' + btoa(`${keyId}:${keySecret}`);
}

app.post('/razorpay', protect, async (c) => {
  try {
    const user = c.get('user');
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const { orderId } = body;
    if (!isValidObjectId(orderId)) return c.json({ message: 'Invalid order ID' }, 400);
    const order = await findOne('orders', { _id: orderId });
    if (!order) return c.json({ message: 'Order not found' }, 404);
    if (String(order.user) !== String(user._id)) return c.json({ message: 'Not authorized' }, 403);
    if (order.isPaid) return c.json({ message: 'Order already paid' }, 400);

    const map = await getSettingsMap();
    const keyId = map.razorpayKeyId || envVar('RAZORPAY_KEY_ID') || '';
    const keySecret = map.razorpayKeySecret || envVar('RAZORPAY_KEY_SECRET') || '';
    if (!keyId || !keySecret) return c.json({ message: 'Razorpay not configured' }, 400);

    const amount = Math.round(order.totalPrice * 100);
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: basicAuth(keyId, keySecret),
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: `order_${order._id}_${Date.now()}`,
        notes: { orderId: order._id.toString(), userId: user._id.toString() },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[PAYMENT] razorpay create order failed:', res.status, JSON.stringify(data));
      return c.json({ message: 'Payment initiation failed' }, 500);
    }
    return c.json({ id: data.id, amount: data.amount, currency: data.currency });
  } catch (err) {
    console.error('[PAYMENT] razorpay error:', err.message);
    return c.json({ message: 'Payment initiation failed' }, 500);
  }
});

app.post('/verify', protect, async (c) => {
  try {
    const user = c.get('user');
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return c.json({ message: 'Missing payment verification data' }, 400);
    }
    if (!isValidObjectId(orderId)) return c.json({ message: 'Invalid order ID' }, 400);

    const map = await getSettingsMap();
    const keySecret = map.razorpayKeySecret || envVar('RAZORPAY_KEY_SECRET') || '';
    if (!keySecret) return c.json({ message: 'Razorpay not configured' }, 400);

    const bodyStr = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = await hmacSha256Hex(keySecret, bodyStr);
    if (expected !== razorpay_signature) {
      return c.json({ message: 'Payment verification failed' }, 400);
    }

    const order = await findOne('orders', { _id: orderId });
    if (!order) return c.json({ message: 'Order not found' }, 404);
    if (order.isPaid) return c.json({ message: 'Order already paid' }, 400);
    if (String(order.user) !== String(user._id)) return c.json({ message: 'Not authorized' }, 403);

    await updateOne('orders', { _id: orderId }, {
      $set: {
        isPaid: true,
        paidAt: new Date(),
        orderStatus: 'confirmed',
        paymentResult: { id: razorpay_payment_id, orderId: razorpay_order_id, status: 'completed' },
        updatedAt: new Date(),
      },
    });

    for (const item of order.items || []) {
      const product = await findOne('products', { _id: item.product });
      if (product) {
        await updateOne('products', { _id: item.product }, { $set: { countInStock: Math.max(0, product.countInStock - item.qty), updatedAt: new Date() } });
      }
    }

    const updated = await findOne('orders', { _id: orderId });
    return c.json({ message: 'Payment successful', order: updated });
  } catch (err) {
    console.error('[PAYMENT] verify error:', err.message);
    return c.json({ message: 'Verification failed' }, 500);
  }
});

app.post('/upi', protect, async (c) => {
  try {
    const user = c.get('user');
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const { orderId, upiTransactionId, upiScreenshot } = body;
    if (!isValidObjectId(orderId)) return c.json({ message: 'Invalid order ID' }, 400);
    if (!upiTransactionId || !UTR_REGEX.test(upiTransactionId)) {
      return c.json({ message: 'Invalid UTR. Must be 8-30 alphanumeric characters.' }, 400);
    }
    const order = await findOne('orders', { _id: orderId });
    if (!order) return c.json({ message: 'Order not found' }, 404);
    if (String(order.user) !== String(user._id)) return c.json({ message: 'Not authorized' }, 403);
    if (order.isPaid) return c.json({ message: 'Order already paid' }, 400);
    if (order.upiPaymentStatus === 'pending') return c.json({ message: 'UPI payment already submitted. Wait for verification.' }, 400);

    const set = { upiTransactionId, upiPaymentStatus: 'pending', paymentMethod: 'upi', updatedAt: new Date() };
    if (upiScreenshot) set.upiScreenshot = upiScreenshot;
    await updateOne('orders', { _id: orderId }, { $set: set });
    const updated = await findOne('orders', { _id: orderId });
    return c.json({ message: 'UPI payment details submitted. Awaiting verification.', order: updated });
  } catch (err) {
    return c.json({ message: 'UPI submission failed' }, 500);
  }
});

app.get('/key', async (c) => {
  const map = await getSettingsMap();
  return c.json({ key: map.razorpayKeyId || envVar('RAZORPAY_KEY_ID') || '' });
});

export default app;