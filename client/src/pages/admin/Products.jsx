import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Loader from '../../components/Loader';
import Message from '../../components/Message';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.products);
    } catch (err) { setError('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1 className="page-title">📦 Manage Products</h1>
          <Link to="/admin/products/new" className="btn btn-primary">+ Add Product</Link>
        </div>
        {error && <Message variant="danger">{error}</Message>}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td className="product-cell">
                    <img src={p.images?.[0] || ''} alt="" className="admin-thumb" />
                    <span className="admin-product-name">{p.name}</span>
                  </td>
                  <td>₹{p.price.toFixed(2)}</td>
                  <td><span className="badge-cat">{p.category}</span></td>
                  <td>
                    <span className={p.countInStock > 0 ? 'text-success' : 'text-danger'}>
                      {p.countInStock}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <Link to={`/admin/products/${p._id}/edit`} className="btn btn-sm btn-edit">Edit</Link>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p._id, p.name)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
