const express = require('express');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');
const logger = require('../services/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { limit = 20, sort = '-createdAt' } = req.query;
    const reviews = await Review.find()
      .sort(sort)
      .limit(parseInt(limit))
      .lean();
    const avg = await Review.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    res.json({
      reviews,
      stats: avg[0] ? { average: Math.round(avg[0].avg * 10) / 10, count: avg[0].count } : { average: 0, count: 0 },
    });
  } catch (err) {
    logger.error('Get reviews error', { message: err.message });
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { rating, title, text } = req.body;
    if (!rating || !text) {
      return res.status(400).json({ message: 'Rating and review text are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    if (text.length > 1000) {
      return res.status(400).json({ message: 'Review must be under 1000 characters' });
    }
    const existing = await Review.findOne({ user: req.user._id });
    if (existing) {
      existing.rating = rating;
      existing.title = title;
      existing.text = text;
      await existing.save();
      logger.info('Review updated', { userId: req.user._id });
      return res.json(existing);
    }
    const review = await Review.create({
      user: req.user._id,
      name: req.user.name,
      rating,
      title,
      text,
      verified: true,
    });
    logger.info('Review created', { userId: req.user._id });
    res.status(201).json(review);
  } catch (err) {
    logger.error('Create review error', { message: err.message });
    res.status(500).json({ message: 'Failed to submit review' });
  }
});

module.exports = router;
