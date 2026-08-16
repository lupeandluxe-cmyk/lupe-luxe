import { Hono } from 'hono';
import { find, count, aggregate } from '../lib/db.js';
import { protect, adminOnly } from '../lib/middleware.js';
import { sanitizeQuery } from '../lib/sanitize.js';

const app = new Hono();

app.get('/dashboard', protect, adminOnly, async (c) => {
  try {
    const [totalOrders, totalSalesArr, totalCustomers, totalProducts, lowStock, recentOrders, recentUsers, revenueByMonth] = await Promise.all([
      count('orders', {}),
      aggregate('orders', [
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      count('users', { isAdmin: false }),
      count('products', {}),
      count('products', { countInStock: { $lte: 5 } }),
      find('orders', { sort: { createdAt: -1 }, limit: 5 }),
      find('users', { projection: { password: 0 }, sort: { createdAt: -1 }, limit: 5 }),
      aggregate('orders', [
        { $match: { isPaid: true } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$totalPrice' },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
    ]);
    const totalSales = totalSalesArr[0]?.total || 0;
    return c.json({ totalOrders, totalSales, totalCustomers, totalProducts, lowStock, recentOrders, recentUsers, revenueByMonth });
  } catch (err) {
    console.error('[REPORTS] dashboard error:', err.message);
    return c.json({ message: err.message }, 500);
  }
});

app.get('/orders', protect, adminOnly, async (c) => {
  try {
    const q = sanitizeQuery(c.req.query());
    const status = q.status;
    const filter = status && status !== 'all' ? { orderStatus: status } : {};
    const orders = await find('orders', { filter, sort: { createdAt: -1 } });
    return c.json(orders);
  } catch (err) {
    return c.json({ message: err.message }, 500);
  }
});

app.get('/products', protect, adminOnly, async (c) => {
  try {
    const products = await find('products', { sort: { createdAt: -1 } });
    return c.json(products);
  } catch (err) {
    return c.json({ message: err.message }, 500);
  }
});

export default app;