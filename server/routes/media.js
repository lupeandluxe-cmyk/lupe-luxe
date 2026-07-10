const express = require('express');
const upload = require('../middleware/upload');
const Media = require('../models/Media');
const { protect, admin } = require('../middleware/auth');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/upload');

const router = express.Router();

router.post('/', protect, admin, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  try {
    const folder = req.body.folder || 'general';
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, folder);
    const media = await Media.create({
      url: result.secure_url,
      publicId: result.public_id,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      folder,
      uploadedBy: req.user._id,
    });
    res.status(201).json(media);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

router.get('/', protect, admin, async (req, res) => {
  const filter = req.query.folder ? { folder: req.query.folder } : {};
  const media = await Media.find(filter).sort({ createdAt: -1 });
  res.json(media);
});

router.delete('/:id', protect, admin, async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (media) {
    if (media.publicId) await deleteFromCloudinary(media.url);
    await media.deleteOne();
    res.json({ message: 'File deleted' });
  } else {
    res.status(404).json({ message: 'File not found' });
  }
});

module.exports = router;
