const express = require('express');
const SiteSetting = require('../models/SiteSetting');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const settings = await SiteSetting.find({});
  const map = {};
  settings.forEach(s => { map[s.key] = s.value; });
  res.json(map);
});

router.get('/public', async (req, res) => {
  const settings = await SiteSetting.find({});
  const map = {};
  settings.forEach(s => { map[s.key] = s.value; });
  res.json(map);
});

router.put('/:key', protect, admin, async (req, res) => {
  const { value, type } = req.body;
  const setting = await SiteSetting.findOneAndUpdate(
    { key: req.params.key },
    { value, type: type || 'text' },
    { upsert: true, new: true }
  );
  res.json(setting);
});

router.post('/bulk', protect, admin, async (req, res) => {
  const ops = req.body.settings || [];
  for (const s of ops) {
    await SiteSetting.findOneAndUpdate(
      { key: s.key },
      { value: s.value, type: s.type || 'text' },
      { upsert: true }
    );
  }
  res.json({ message: 'Settings updated' });
});

module.exports = router;
