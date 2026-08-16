import { Hono } from 'hono';
import { find, findOne, updateOne } from '../lib/db.js';
import { protect, adminOnly } from '../lib/middleware.js';
import { sanitizeBody } from '../lib/sanitize.js';

const app = new Hono();

const SENSITIVE_KEYS = ['razorpayKeySecret', 'emailPass', 'emailUser'];

app.get('/', async (c) => {
  try {
    const settings = await find('sitesettings');
    const map = {};
    settings.forEach((s) => { map[s.key] = s.value; });
    return c.json(map);
  } catch (err) {
    return c.json({ message: 'Failed to load settings' }, 500);
  }
});

app.get('/public', async (c) => {
  try {
    const settings = await find('sitesettings');
    const map = {};
    settings.forEach((s) => {
      if (!SENSITIVE_KEYS.includes(s.key)) map[s.key] = s.value;
    });
    return c.json(map);
  } catch (err) {
    return c.json({ message: 'Failed to load settings' }, 500);
  }
});

app.put('/:key', protect, adminOnly, async (c) => {
  try {
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const key = String(c.req.param('key')).trim();
    if (!key) return c.json({ message: 'Key is required' }, 400);
    const { value, type } = body;
    if (SENSITIVE_KEYS.includes(key) && !value) {
      return c.json({ message: 'Value is required for sensitive settings' }, 400);
    }
    const allowedTypes = ['text', 'image', 'color', 'boolean', 'number', 'json'];
    const settingType = allowedTypes.includes(type) ? type : 'text';
    const updated = await updateOne('sitesettings', { key }, { $set: { value, type: settingType, updatedAt: new Date() } }, true);
    const setting = await findOne('sitesettings', { key });
    return c.json(setting || { key, value, type: settingType });
  } catch (err) {
    return c.json({ message: 'Failed to update setting' }, 500);
  }
});

app.post('/bulk', protect, adminOnly, async (c) => {
  try {
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const ops = body.settings || [];
    const allowedKeys = ['siteName', 'siteDescription', 'siteLogo', 'favicon', 'instagramUrl', 'facebookUrl', 'twitterUrl', 'contactEmail', 'contactPhone', 'address', 'currency', 'upiEnabled', 'upiId', 'upiHolderName', 'upiQrImage', 'razorpayEnabled', 'razorpayKeyId', 'razorpayKeySecret', 'razorpayTestMode', 'codEnabled', 'emailNotifications', 'emailUser', 'emailPass', 'whatsappNumber', 'announcement', 'announcementEnabled', 'freeShippingThreshold', 'taxRate', 'shippingRate'];
    for (const s of ops) {
      if (!allowedKeys.includes(s.key)) continue;
      if (s.key === 'razorpayKeySecret' && !s.value) continue;
      await updateOne('sitesettings', { key: s.key }, { $set: { value: s.value, type: s.type || 'text', updatedAt: new Date() } }, true);
    }
    return c.json({ message: 'Settings updated' });
  } catch (err) {
    return c.json({ message: 'Failed to update settings' }, 500);
  }
});

export default app;