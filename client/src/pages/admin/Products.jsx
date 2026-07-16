import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try { const res = await api.get('/products/all'); setProducts(res.data); setError(''); } catch (e) {
      const msg = e.response?.status === 401 ? 'Session expired. Please log in again.' : (e.response?.data?.message || 'Failed to load products');
      setError(msg);
    }
    finally { setLoading(false); }
  };

  const toggleVisibility = async (id, visible) => {
    try { await api.put(`/products/${id}`, { visible: !visible }); fetchProducts(); } catch (e) {
      const msg = e.response?.status === 401 ? 'Session expired. Please log in again.' : (e.response?.data?.message || 'Failed to update product');
      setError(msg);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); fetchProducts(); } catch (e) {
      const msg = e.response?.status === 401 ? 'Session expired. Please log in again.' : (e.response?.data?.message || 'Failed to delete product');
      setError(msg);
    }
  };

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-page-content">
      <div className="page-header">
        <h1 className="admin-page-title">Products ({products.length})</h1>
        <Link to="/admin/products/new" className="btn btn-primary">+ Add Product</Link>
      </div>
      {error && <div className="admin-error-banner">{error}</div>}
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr><th>Image</th><th>Name</th><th>Price</th><th>Stock</th><th>Category</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id}>
                <td><img src={p.images?.[0] || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect fill="%23333" width="40" height="40"/><text x="20" y="26" text-anchor="middle" fill="%23666" font-size="18">📷</text></svg>'} alt="" className="table-thumb" /></td>
                <td>{p.name}</td>
                <td>₹{p.salePrice || p.price}</td>
                <td><span className={p.countInStock <= 5 ? 'text-danger' : ''}>{p.countInStock}</span></td>
                <td>{p.category}</td>
                <td>
                  <span className={`badge ${p.visible ? 'active' : 'inactive'}`} onClick={() => toggleVisibility(p._id, p.visible)} style={{ cursor: 'pointer' }}>
                    {p.visible ? 'Visible' : 'Hidden'}
                  </span>
                </td>
                <td className="action-cell">
                  <Link to={`/admin/products/${p._id}/edit`} className="btn-sm">✏️</Link>
                  <button onClick={() => deleteProduct(p._id)} className="btn-sm danger">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
