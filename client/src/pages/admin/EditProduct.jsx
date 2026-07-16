import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [form, setForm] = useState({
    name: '', description: '', price: '', salePrice: '', category: '',
    countInStock: '', sku: '', featured: false, bestSeller: false, visible: true,
    tags: '', size: '', images: [],
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragIndex, setDragIndex] = useState(null);

  useEffect(() => {
    if (!isNew) {
      api.get(`/products/${id}`).then(res => {
        const p = res.data;
        setForm({
          name: p.name, description: p.description, price: p.price,
          salePrice: p.salePrice || '', category: p.category,
          countInStock: p.countInStock, sku: p.sku || '', featured: p.featured,
          bestSeller: p.bestSeller, visible: p.visible !== false,
          tags: p.tags?.join(', ') || '', size: p.size?.join(', ') || '',
          images: p.images || [],
        });
        setLoading(false);
      });
    }
  }, [id]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Invalid file type. Allowed: JPEG, PNG, WebP');
      return false;
    }
    if (file.size > MAX_SIZE) {
      setError('File too large. Maximum 10MB');
      return false;
    }
    return true;
  };

  const resetUploadState = () => {
    setUploading(false);
    setPreviewUrl(null);
    setUploadProgress(0);
  };

  const uploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setSuccess('');
    if (!validateFile(file)) { e.target.value = ''; return; }

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    setUploadProgress(0);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'products');

    try {
      const res = await api.post('/media', fd, {
        onUploadProgress: (p) => {
          setUploadProgress(Math.round((p.loaded / p.total) * 100));
        },
      });
      if (form.images.includes(res.data.url)) {
        setError('This image is already added');
        return;
      }
      setForm({ ...form, images: [...form.images, res.data.url] });
      setSuccess('Image uploaded');
    } catch (err) {
      const msg = err.code === 'ECONNABORTED'
        ? 'Upload timed out. Check your connection and try again.'
        : (err.response?.data?.message || 'Upload failed. Please try again.');
      setError(msg);
    } finally {
      resetUploadState();
      e.target.value = '';
    }
  };

  const removeImage = async (idx) => {
    const url = form.images[idx];
    setError('');
    setSuccess('');
    try {
      await api.post('/media/delete-by-url', { url });
    } catch {}
    setForm({ ...form, images: form.images.filter((_, i) => i !== idx) });
  };

  const replaceImage = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setSuccess('');
    if (!validateFile(file)) { e.target.value = ''; return; }

    setUploading(true);
    setUploadProgress(0);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'products');

    try {
      const res = await api.post('/media', fd, {
        onUploadProgress: (p) => {
          setUploadProgress(Math.round((p.loaded / p.total) * 100));
        },
      });
      const oldUrl = form.images[idx];
      try { await api.post('/media/delete-by-url', { url: oldUrl }); } catch {}
      const updated = [...form.images];
      updated[idx] = res.data.url;
      setForm({ ...form, images: updated });
      setSuccess('Image replaced');
    } catch (err) {
      const msg = err.code === 'ECONNABORTED'
        ? 'Replace timed out. Check your connection and try again.'
        : (err.response?.data?.message || 'Replace failed. Please try again.');
      setError(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleDragStart = (e, idx) => {
    setDragIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    const updated = [...form.images];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(idx, 0, moved);
    setForm({ ...form, images: updated });
    setDragIndex(null);
  };

  const setCover = (idx) => {
    if (idx === 0) return;
    const updated = [...form.images];
    const [cover] = updated.splice(idx, 1);
    updated.unshift(cover);
    setForm({ ...form, images: updated });
    setSuccess('Cover image updated');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    const data = {
      ...form,
      price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : undefined,
      countInStock: Number(form.countInStock) || 0,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      size: form.size.split(',').map(s => s.trim()).filter(Boolean),
    };
    try {
      if (isNew) {
        await api.post('/products', data);
      } else {
        await api.put(`/products/${id}`, data);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
    setSaving(false);
  };

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-page-content">
      <h1 className="admin-page-title">{isNew ? 'New Product' : 'Edit Product'}</h1>
      {error && <div className="admin-form-error">{error}</div>}
      {success && <div className="admin-form-success">{success}</div>}
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-grid">
          <div className="form-group"><label>Name</label><input name="name" value={form.name} onChange={handleChange} required /></div>
          <div className="form-group"><label>Category</label><input name="category" value={form.category} onChange={handleChange} required /></div>
          <div className="form-group"><label>Price (₹)</label><input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required /></div>
          <div className="form-group"><label>Sale Price (₹)</label><input name="salePrice" type="number" step="0.01" value={form.salePrice} onChange={handleChange} /></div>
          <div className="form-group"><label>Stock</label><input name="countInStock" type="number" value={form.countInStock} onChange={handleChange} required /></div>
          <div className="form-group"><label>SKU</label><input name="sku" value={form.sku} onChange={handleChange} /></div>
          <div className="form-group"><label>Tags (comma separated)</label><input name="tags" value={form.tags} onChange={handleChange} /></div>
          <div className="form-group"><label>Sizes (comma separated)</label><input name="size" value={form.size} onChange={handleChange} /></div>
        </div>
        <div className="form-group"><label>Description</label><textarea name="description" rows="4" value={form.description} onChange={handleChange} required /></div>
        <div className="form-row">
          <label><input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
          <label><input type="checkbox" checked={form.bestSeller} onChange={e => setForm({ ...form, bestSeller: e.target.checked })} /> Best Seller</label>
          <label><input type="checkbox" checked={!form.visible} onChange={e => setForm({ ...form, visible: !e.target.checked })} /> Hidden</label>
        </div>
        <div className="form-group"><label>Images</label>
          <div className="image-upload-area">
            {form.images.map((img, i) => (
              <div
                key={i}
                className={`image-preview ${i === 0 ? 'is-cover' : ''} ${dragIndex === i ? 'dragging' : ''}`}
                draggable
                onDragStart={e => handleDragStart(e, i)}
                onDragOver={e => handleDragOver(e, i)}
                onDrop={e => handleDrop(e, i)}
                onDragEnd={() => setDragIndex(null)}
              >
                <img src={img} alt="" />
                <div className="image-preview-actions">
                  {i !== 0 && <button type="button" onClick={() => setCover(i)} className="img-action set-cover" title="Set as cover">★</button>}
                  <label className="img-action replace-img" title="Replace">
                    🔄
                    <input type="file" onChange={e => replaceImage(e, i)} hidden accept="image/*" disabled={uploading} />
                  </label>
                  <button type="button" onClick={() => removeImage(i)} className="img-action remove-img" title="Remove">✕</button>
                </div>
                {i === 0 && <span className="cover-badge">Cover</span>}
              </div>
            ))}
            <div className="image-preview upload-placeholder">
              {uploading ? (
                <div className="upload-progress-wrap">
                  {previewUrl && <img src={previewUrl} alt="" className="upload-preview" />}
                  <div className="upload-progress-bar">
                    <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="upload-progress-text">{uploadProgress}%</span>
                </div>
              ) : (
                <label className="upload-btn">
                  + Upload
                  <input type="file" onChange={uploadImage} hidden accept="image/*" />
                </label>
              )}
            </div>
          </div>
          <small className="form-help">JPEG, PNG, WebP only. Max 10MB. Drag images to reorder. First image is the cover.</small>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
          {saving ? 'Saving...' : (isNew ? 'Create Product' : 'Save Changes')}
        </button>
      </form>
    </div>
  );
}