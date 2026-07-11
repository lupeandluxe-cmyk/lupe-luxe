const express = require('express');
const SiteSetting = require('../models/SiteSetting');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

const SENSITIVE_KEYS = ['razorpayKeySecret', 'emailPass', 'emailUser'];

router.get('/', async (req, res) => {
  try {
    const settings = await SiteSetting.find({});
    const map = {};
    settings.forEach(s => { map[s.key] = s.value; });
    res.json(map);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load settings' });
  }
});

router.get('/public', async (req, res) => {
  try {
    const settings = await SiteSetting.find({});
    const map = {};
    settings.forEach(s => {
      if (!SENSITIVE_KEYS.includes(s.key)) {
        map[s.key] = s.value;
      }
    });
    res.json(map);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load settings' });
  }
});

router.put('/:key', protect, admin, async (req, res) => {
  try {
    const { value, type } = req.body;
    const key = String(req.params.key).trim();
    if (!key) return res.status(400).json({ message: 'Key is required' });
    if (SENSITIVE_KEYS.includes(key) && !value) {
      return res.status(400).json({ message: 'Value is required for sensitive settings' });
    }
    const allowedTypes = ['text', 'image', 'color', 'boolean', 'number', 'json'];
    const settingType = allowedTypes.includes(type) ? type : 'text';
    const setting = await SiteSetting.findOneAndUpdate(
      { key },
      { value, type: settingType },
      { upsert: true, new: true }
    );
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update setting' });
  }
});

router.post('/bulk', protect, admin, async (req, res) => {
  try {
    const ops = req.body.settings || [];
    const allowedKeys = ['siteName', 'siteDescription', 'siteLogo', 'favicon', 'instagramUrl', 'facebookUrl', 'twitterUrl', 'contactEmail', 'contactPhone', 'address', 'currency', 'upiEnabled', 'upiId', 'upiHolderName', 'upiQrImage', 'razorpayEnabled', 'razorpayKeyId', 'razorpayKeySecret', 'razorpayTestMode', 'codEnabled', 'emailNotifications', 'emailUser', 'emailPass', 'whatsappNumber', 'announcement', 'announcementEnabled', 'freeShippingThreshold', 'taxRate', 'shippingRate'];
    for (const s of ops) {
      if (!allowedKeys.includes(s.key)) continue;
      if (s.key === 'razorpayKeySecret' && !s.value) continue;
      await SiteSetting.findOneAndUpdate(
        { key: s.key },
        { value: s.value, type: s.type || 'text' },
        { upsert: true }
      );
    }
    res.json({ message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

module.exports = router;
