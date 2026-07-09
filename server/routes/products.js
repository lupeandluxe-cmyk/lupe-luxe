const express = require('express');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const pageSize = 12;
  const page = Number(req.query.page) || 1;
  const keyword = req.query.keyword
    ? { name: { $regex: req.query.keyword, $options: 'i' } }
    : {};
  const category = req.query.category ? { category: req.query.category } : {};
  const count = await Product.countDocuments({ ...keyword, ...category });
  const products = await Product.find({ ...keyword, ...category })
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));
  res.json({ products, page, pages: Math.ceil(count / pageSize), count });
});

router.get('/categories', async (req, res) => {
  const categories = await Product.distinct('category');
  res.json(categories);
});

router.get('/featured', async (req, res) => {
  const products = await Product.find({ featured: true }).limit(8);
  res.json(products);
});

router.get('/latest', async (req, res) => {
  const products = await Product.find({}).sort({ createdAt: -1 }).limit(8);
  res.json(products);
});

router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) res.json(product);
  else res.status(404).json({ message: 'Product not found' });
});

router.post('/', protect, admin, async (req, res) => {
  const { name, description, price, images, category, tags, size, countInStock, featured } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const product = await Product.create({
    name, slug, description, price, images, category, tags, size,
    countInStock, featured: featured || false,
  });
  res.status(201).json(product);
});

router.put('/:id', protect, admin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    Object.assign(product, req.body);
    if (req.body.name) {
      product.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    const updated = await product.save();
    res.json(updated);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

module.exports = router;
