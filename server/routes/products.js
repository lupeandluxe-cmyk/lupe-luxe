const express = require('express');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const pageSize = 12;
    const page = Number(req.query.page) || 1;
    const keyword = req.query.keyword
      ? { name: { $regex: req.query.keyword, $options: 'i' } }
      : {};
    const category = req.query.category ? { category: req.query.category } : {};
    const visible = { visible: true };
    const count = await Product.countDocuments({ ...keyword, ...category, ...visible });
    const products = await Product.find({ ...keyword, ...category, ...visible })
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));
    res.json({ products, page, pages: Math.ceil(count / pageSize), count });
  } catch (err) {
    console.error('[PRODUCTS] List error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ featured: true, visible: true }).limit(8);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/best-sellers', async (req, res) => {
  try {
    const products = await Product.find({ bestSeller: true, visible: true }).limit(8);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const products = await Product.find({ visible: true }).sort({ createdAt: -1 }).limit(8);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/all', protect, admin, async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product && product.visible) res.json(product);
    else if (product) res.json(product);
    else res.status(404).json({ message: 'Product not found' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, description, price, salePrice, images, category, tags, size, countInStock, sku, featured, bestSeller, visible } = req.body;
    if (!name || !description || price == null || !category || countInStock == null) {
      return res.status(400).json({ message: 'name, description, price, category, and countInStock are required' });
    }
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ message: 'price must be a positive number' });
    }
    if (isNaN(Number(countInStock)) || Number(countInStock) < 0) {
      return res.status(400).json({ message: 'countInStock must be a non-negative number' });
    }
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await Product.findOne({ slug });
    if (existing) slug = slug + '-' + Date.now();
    const product = await Product.create({
      name, slug, description, price, salePrice, images, category, tags, size,
      countInStock, sku, featured: featured || false, bestSeller: bestSeller || false,
      visible: visible !== false,
    });
    res.status(201).json(product);
  } catch (err) {
    console.error('[PRODUCTS] Create error:', err.message, err.code);
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      const allowed = ['name', 'description', 'price', 'salePrice', 'images', 'category', 'tags', 'size', 'countInStock', 'sku', 'featured', 'bestSeller', 'visible'];
      allowed.forEach(f => { if (req.body[f] !== undefined) product[f] = req.body[f]; });
      if (req.body.name) {
        let newSlug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const slugExists = await Product.findOne({ slug: newSlug, _id: { $ne: req.params.id } });
        if (slugExists) newSlug = newSlug + '-' + Date.now();
        product.slug = newSlug;
      }
      const updated = await product.save();
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
