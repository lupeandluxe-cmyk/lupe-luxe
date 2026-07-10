const express = require('express');
const upload = require('../middleware/upload');
const Media = require('../models/Media');
const { protect } = require('../middleware/auth');
const { uploadToCloudinary } = require('../services/upload');

const router = express.Router();

router.post('/upi', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'upi');
    const media = await Media.create({
      url: result.secure_url,
      publicId: result.public_id,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      folder: 'upi',
      uploadedBy: req.user._id,
    });
    res.status(201).json(media);
  } catch (err) {
    console.error('UPI upload error:', err.message);
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
});

module.exports = router;
