const express = require('express');
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const categories = await Category.find({ active: true }).sort({ order: 1 });
  res.json(categories);
});

router.get('/all', protect, admin, async (req, res) => {
  const categories = await Category.find({}).sort({ order: 1 });
  res.json(categories);
});

router.post('/', protect, admin, async (req, res) => {
  const { name, description, image, parent, order } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const category = await Category.create({ name, slug, description, image, parent, order });
  res.status(201).json(category);
});

router.put('/:id', protect, admin, async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(category);
});

router.delete('/:id', protect, admin, async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Category deleted' });
});

module.exports = router;
