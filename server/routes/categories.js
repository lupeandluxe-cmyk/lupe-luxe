const express = require('express');
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ active: true }).sort({ order: 1 });
    res.json(categories);
  } catch {
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

router.get('/all', protect, admin, async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ order: 1 });
    res.json(categories);
  } catch {
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, description, image, parent, order } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });
    const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const category = await Category.create({
      name: String(name).trim(),
      slug,
      description: description ? String(description).trim() : undefined,
      image: image || undefined,
      parent: parent || undefined,
      order: Number(order) || 0,
    });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create category' });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const allowed = ['name', 'description', 'image', 'parent', 'order', 'active'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update category' });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch {
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

module.exports = router;
