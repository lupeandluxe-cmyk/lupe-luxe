const express = require('express');
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload');
const Media = require('../models/Media');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, admin, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const media = await Media.create({
    url: '/uploads/' + (req.body.folder || 'general') + '/' + req.file.filename,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
    folder: req.body.folder || 'general',
    uploadedBy: req.user._id,
  });
  res.status(201).json(media);
});

router.get('/', protect, admin, async (req, res) => {
  const filter = req.query.folder ? { folder: req.query.folder } : {};
  const media = await Media.find(filter).sort({ createdAt: -1 });
  res.json(media);
});

router.delete('/:id', protect, admin, async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (media) {
    const filePath = path.resolve(__dirname, '..', media.url.replace(/^\//, ''));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await media.deleteOne();
    res.json({ message: 'File deleted' });
  } else {
    res.status(404).json({ message: 'File not found' });
  }
});

module.exports = router;
