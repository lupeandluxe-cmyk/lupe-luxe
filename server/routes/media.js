const express = require('express');
const upload = require('../middleware/upload');
const Media = require('../models/Media');
const { protect, admin } = require('../middleware/auth');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/upload');

const router = express.Router();

router.post('/', protect, admin, (req, res) => {
  console.log('[MEDIA] POST /media — route handler entered');
  console.log('[MEDIA] Content-Type:', req.headers['content-type']);
  console.log('[MEDIA] Content-Length:', req.headers['content-length']);
  console.log('[MEDIA] Auth header present:', !!req.headers.authorization);
  console.log('[MEDIA] User:', req.user?._id, req.user?.email);

  upload.single('file')(req, res, async (err) => {
    console.log('[MEDIA] Multer callback called');

    if (err) {
      console.error('[MEDIA] Multer error:', err.code, err.message);
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Maximum 10MB'
        : (err.message || 'Upload rejected');
      return res.status(400).json({ message });
    }

    console.log('[MEDIA] req.file present:', !!req.file);
    console.log('[MEDIA] req.body:', req.body);

    if (!req.file) {
      console.error('[MEDIA] No file in request — returning 400');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('[MEDIA] File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      encoding: req.file.encoding,
    });

    try {
      const folder = req.body.folder || 'general';
      console.log('[MEDIA] Calling uploadToCloudinary with folder:', folder);
      console.log('[MEDIA] Upload buffer length:', req.file.buffer.length);

      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, folder);

      console.log('[MEDIA] Cloudinary upload succeeded — result:', {
        public_id: result.public_id,
        secure_url: result.secure_url?.substring(0, 60),
        bytes: result.bytes,
        format: result.format,
      });

      console.log('[MEDIA] Saving Media record to MongoDB...');
      const media = await Media.create({
        url: result.secure_url,
        publicId: result.public_id,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        folder,
        uploadedBy: req.user._id,
      });
      console.log('[MEDIA] Media saved to MongoDB — _id:', media._id, 'url:', media.url?.substring(0, 60));

      console.log('[MEDIA] Sending 201 response to client');
      res.status(201).json(media);
    } catch (cloudErr) {
      console.error('[MEDIA] Upload FAILED — error:', cloudErr.message);
      console.error('[MEDIA] Error stack:', cloudErr.stack?.substring(0, 300));
      console.error('[MEDIA] Full error object:', JSON.stringify(cloudErr, Object.getOwnPropertyNames(cloudErr)));

      console.log('[MEDIA] Sending 500 error response to client');
      res.status(500).json({ message: cloudErr.message || 'Upload failed' });
    }
  });
});

router.get('/', protect, admin, async (req, res) => {
  try {
    const filter = req.query.folder ? { folder: req.query.folder } : {};
    const media = await Media.find(filter).sort({ createdAt: -1 });
    res.json(media);
  } catch (err) {
    console.error('[MEDIA] List error:', err.message);
    res.status(500).json({ message: 'Failed to fetch media' });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (media) {
      if (media.publicId) await deleteFromCloudinary(media.publicId);
      await media.deleteOne();
      res.json({ message: 'File deleted' });
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (err) {
    console.error('[MEDIA] Delete error:', err.message);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

router.post('/delete-by-url', protect, admin, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });
    const media = await Media.findOne({ url });
    if (media) {
      if (media.publicId) await deleteFromCloudinary(media.publicId);
      await media.deleteOne();
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[MEDIA] Delete-by-url error:', err.message);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

module.exports = router;