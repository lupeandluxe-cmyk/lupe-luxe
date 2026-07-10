import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

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
  const [uploading, setUploading] = useState(false);

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

  const uploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'products');
    const res = await api.post('/media', fd);
    setForm({ ...form, images: [...form.images, res.data.url] });
    setUploading(false);
  };

  const removeImage = (idx) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : undefined,
      countInStock: Number(form.countInStock),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      size: form.size.split(',').map(s => s.trim()).filter(Boolean),
    };
    if (isNew) {
      await api.post('/products', data);
    } else {
      await api.put(`/products/${id}`, data);
    }
    navigate('/admin/products');
  };

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-page-content">
      <h1 className="admin-page-title">{isNew ? 'New Product' : 'Edit Product'}</h1>
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
              <div key={i} className="image-preview"><img src={img} alt="" /><button type="button" onClick={() => removeImage(i)} className="remove-img">×</button></div>
            ))}
            <label className="upload-btn">{uploading ? 'Uploading...' : '+ Upload'}<input type="file" onChange={uploadImage} hidden accept="image/*" /></label>
          </div>
        </div>
        <button type="submit" className="btn btn-primary">{isNew ? 'Create Product' : 'Save Changes'}</button>
      </form>
    </div>
  );
}
