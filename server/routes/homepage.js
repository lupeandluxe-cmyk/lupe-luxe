const express = require('express');
const HomepageSection = require('../models/HomepageSection');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const sections = await HomepageSection.find({ active: true }).sort({ order: 1 });
  res.json(sections);
});

router.get('/all', protect, admin, async (req, res) => {
  const sections = await HomepageSection.find({}).sort({ order: 1 });
  res.json(sections);
});

router.post('/', protect, admin, async (req, res) => {
  const section = await HomepageSection.create(req.body);
  res.status(201).json(section);
});

router.put('/:id', protect, admin, async (req, res) => {
  const section = await HomepageSection.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(section);
});

router.delete('/:id', protect, admin, async (req, res) => {
  await HomepageSection.findByIdAndDelete(req.params.id);
  res.json({ message: 'Section deleted' });
});

module.exports = router;
