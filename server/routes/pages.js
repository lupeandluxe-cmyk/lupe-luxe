const express = require('express');
const Page = require('../models/Page');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/:slug', async (req, res) => {
  const page = await Page.findOne({ slug: req.params.slug, published: true });
  if (page) res.json(page);
  else res.status(404).json({ message: 'Page not found' });
});

router.get('/', protect, admin, async (req, res) => {
  const pages = await Page.find({}).sort({ createdAt: -1 });
  res.json(pages);
});

router.post('/', protect, admin, async (req, res) => {
  const { title, content, slug, metaTitle, metaDescription } = req.body;
  const pageSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const page = await Page.create({ title, content, slug: pageSlug, metaTitle, metaDescription });
  res.status(201).json(page);
});

router.put('/:id', protect, admin, async (req, res) => {
  const page = await Page.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(page);
});

router.delete('/:id', protect, admin, async (req, res) => {
  await Page.findByIdAndDelete(req.params.id);
  res.json({ message: 'Page deleted' });
});

module.exports = router;
