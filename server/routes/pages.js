const express = require('express');
const Page = require('../models/Page');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/:slug', async (req, res) => {
  try {
    const slug = String(req.params.slug).trim();
    const page = await Page.findOne({ slug, published: true });
    if (page) res.json(page);
    else res.status(404).json({ message: 'Page not found' });
  } catch {
    res.status(500).json({ message: 'Failed to fetch page' });
  }
});

router.get('/', protect, admin, async (req, res) => {
  try {
    const pages = await Page.find({}).sort({ createdAt: -1 });
    res.json(pages);
  } catch {
    res.status(500).json({ message: 'Failed to fetch pages' });
  }
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, content, slug, metaTitle, metaDescription } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    const pageSlug = slug
      ? String(slug).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const page = await Page.create({
      title: String(title).trim(),
      content: content || '',
      slug: pageSlug,
      metaTitle: metaTitle ? String(metaTitle).trim() : undefined,
      metaDescription: metaDescription ? String(metaDescription).trim() : undefined,
    });
    res.status(201).json(page);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create page' });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const allowed = ['title', 'content', 'metaTitle', 'metaDescription', 'published'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const page = await Page.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.json(page);
  } catch {
    res.status(500).json({ message: 'Failed to update page' });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const page = await Page.findByIdAndDelete(req.params.id);
    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.json({ message: 'Page deleted' });
  } catch {
    res.status(500).json({ message: 'Failed to delete page' });
  }
});

module.exports = router;
