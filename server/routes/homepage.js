const express = require('express');
const HomepageSection = require('../models/HomepageSection');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const sections = await HomepageSection.find({ active: true }).sort({ order: 1 });
    res.json(sections);
  } catch {
    res.status(500).json({ message: 'Failed to load homepage' });
  }
});

router.get('/all', protect, admin, async (req, res) => {
  try {
    const sections = await HomepageSection.find({}).sort({ order: 1 });
    res.json(sections);
  } catch {
    res.status(500).json({ message: 'Failed to load homepage' });
  }
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const allowed = ['section', 'type', 'title', 'subtitle', 'text', 'image', 'video', 'buttonText', 'buttonLink', 'images', 'items', 'order', 'active'];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (!data.type) return res.status(400).json({ message: 'Section type is required' });
    const allowedTypes = ['hero', 'banner', 'featured', 'collection', 'testimonial', 'promo', 'newsletter', 'announcement'];
    if (!allowedTypes.includes(data.type)) {
      return res.status(400).json({ message: 'Invalid section type' });
    }
    const section = await HomepageSection.create(data);
    res.status(201).json(section);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create section' });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const allowed = ['section', 'type', 'title', 'subtitle', 'text', 'image', 'video', 'buttonText', 'buttonLink', 'images', 'items', 'order', 'active'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const section = await HomepageSection.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!section) return res.status(404).json({ message: 'Section not found' });
    res.json(section);
  } catch {
    res.status(500).json({ message: 'Failed to update section' });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const section = await HomepageSection.findByIdAndDelete(req.params.id);
    if (!section) return res.status(404).json({ message: 'Section not found' });
    res.json({ message: 'Section deleted' });
  } catch {
    res.status(500).json({ message: 'Failed to delete section' });
  }
});

module.exports = router;
