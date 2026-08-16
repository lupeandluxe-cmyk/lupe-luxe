import { Hono } from 'hono';
import { findOne, insertOne } from '../lib/db.js';
import { protect } from '../lib/middleware.js';
import { uploadToCloudinary } from '../lib/cloudinary.js';

const app = new Hono();

app.post('/upi', protect, async (c) => {
  const form = await c.req.formData().catch(() => null);
  if (!form) return c.json({ message: 'No file uploaded' }, 400);
  const file = form.get('file');
  if (!file || typeof file === 'string') return c.json({ message: 'No file uploaded' }, 400);
  if (file.size > 10 * 1024 * 1024) return c.json({ message: 'File too large (max 10MB)' }, 400);

  try {
    const buffer = await file.arrayBuffer();
    const result = await uploadToCloudinary(buffer, file.type || 'application/octet-stream', 'upi', file.name);
    const id = await insertOne('media', {
      url: result.secure_url,
      publicId: result.public_id,
      filename: file.name || 'upi-upload',
      mimetype: file.type || 'application/octet-stream',
      size: file.size,
      folder: 'upi',
      uploadedBy: c.get('user')._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const media = await findOne('media', { _id: id });
    return c.json(media, 201);
  } catch (err) {
    console.error('[UPLOAD] upi upload error:', err.message);
    return c.json({ message: err.message || 'Upload failed' }, 500);
  }
});

export default app;