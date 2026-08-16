import { Hono } from 'hono';
import { find, findOne, insertOne, deleteOne } from '../lib/db.js';
import { protect, adminOnly } from '../lib/middleware.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../lib/cloudinary.js';

const app = new Hono();

function parseFormData(data) {
  const out = {};
  data.forEach((v, k) => { out[k] = v; });
  return out;
}

app.post('/', protect, adminOnly, async (c) => {
  const form = await c.req.formData().catch(() => null);
  if (!form) return c.json({ message: 'No file uploaded' }, 400);
  const file = form.get('file');
  const fields = parseFormData(form);
  if (!file || typeof file === 'string') return c.json({ message: 'No file uploaded' }, 400);
  if (file.size > 10 * 1024 * 1024) return c.json({ message: 'File too large. Maximum 10MB' }, 400);
  const folder = fields.folder || 'general';

  try {
    const buffer = await file.arrayBuffer();
    const result = await uploadToCloudinary(buffer, file.type || 'application/octet-stream', folder, file.name);
    const id = await insertOne('media', {
      url: result.secure_url,
      publicId: result.public_id,
      filename: file.name || 'upload',
      mimetype: file.type || 'application/octet-stream',
      size: file.size,
      folder,
      uploadedBy: c.get('user')._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const media = await findOne('media', { _id: id });
    return c.json(media, 201);
  } catch (err) {
    console.error('[MEDIA] upload failed:', err.message);
    return c.json({ message: err.message || 'Upload failed' }, 500);
  }
});

app.get('/', protect, adminOnly, async (c) => {
  try {
    const filter = c.req.query('folder') ? { folder: c.req.query('folder') } : {};
    const media = await find('media', { filter, sort: { createdAt: -1 } });
    return c.json(media);
  } catch (err) {
    return c.json({ message: 'Failed to fetch media' }, 500);
  }
});

app.delete('/:id', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const media = await findOne('media', { _id: id });
    if (!media) return c.json({ message: 'File not found' }, 404);
    if (media.publicId) await deleteFromCloudinary(media.publicId);
    await deleteOne('media', { _id: id });
    return c.json({ message: 'File deleted' });
  } catch (err) {
    return c.json({ message: 'Failed to delete file' }, 500);
  }
});

app.post('/delete-by-url', protect, adminOnly, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { url } = body;
    if (!url) return c.json({ message: 'URL is required' }, 400);
    const media = await findOne('media', { url });
    if (media) {
      if (media.publicId) await deleteFromCloudinary(media.publicId);
      await deleteOne('media', { _id: media._id });
    }
    return c.json({ message: 'Deleted' });
  } catch (err) {
    return c.json({ message: 'Failed to delete file' }, 500);
  }
});

export default app;