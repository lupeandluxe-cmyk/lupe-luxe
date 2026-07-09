import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Loader from '../../components/Loader';
import Message from '../../components/Message';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [form, setForm] = useState({
    name: '', description: '', price: '', images: '',
    category: '', tags: '', size: '', countInStock: '', featured: false,
  });
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      api.get(`/products/${id}`)
        .then(({ data }) => setForm({
          name: data.name,
          description: data.description,
          price: data.price.toString(),
          images: data.images?.join(', ') || '',
          category: data.category,
          tags: data.tags?.join(', ') || '',
          size: data.size?.join(', ') || '',
          countInStock: data.countInStock.toString(),
          featured: data.featured || false,
        }))
        .catch(() => setError('Product not found'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        countInStock: Number(form.countInStock),
        images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
        tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
        size: form.size.split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (isNew) await api.post('/products', payload);
      else await api.put(`/products/${id}`, payload);
      navigate('/admin/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="admin-page">
      <div className="container">
        <h1 className="page-title">{isNew ? '✦ Add New Product' : '✎ Edit Product'}</h1>
        {error && <Message variant="danger">{error}</Message>}
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Product Name</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Price ($)</label>
              <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input name="countInStock" type="number" value={form.countInStock} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label>Image URLs (comma separated)</label>
            <input name="images" value={form.images} onChange={handleChange} placeholder="https://..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <input name="category" value={form.category} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input name="tags" value={form.tags} onChange={handleChange} placeholder="luffy, premium, custom" />
            </div>
          </div>
          <div className="form-group">
            <label>Sizes (comma separated, e.g. S, M, L)</label>
            <input name="size" value={form.size} onChange={handleChange} placeholder="S, M, L, XL" />
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} />
              <span>Featured product</span>
            </label>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? 'Saving...' : isNew ? 'Create Product' : 'Update Product'}
          </button>
        </form>
      </div>
    </div>
  );
}
