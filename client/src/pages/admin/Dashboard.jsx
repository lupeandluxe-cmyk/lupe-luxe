import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Loader from '../../components/Loader';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, orderRes] = await Promise.all([
          api.get('/products'),
          api.get('/orders'),
        ]);
        const products = prodRes.data.count || 0;
        const orders = orderRes.data;
        const revenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
        setStats({ products, orders: orders.length, revenue });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="admin-page">
      <div className="container">
        <h1 className="page-title">☠ Captain's Quarters</h1>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">📦</span>
            <div>
              <h3>Products</h3>
              <p className="stat-value">{stats.products}</p>
              <Link to="/admin/products" className="stat-link">Manage →</Link>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📋</span>
            <div>
              <h3>Orders</h3>
              <p className="stat-value">{stats.orders}</p>
              <Link to="/admin/orders" className="stat-link">View →</Link>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💰</span>
            <div>
              <h3>Revenue</h3>
              <p className="stat-value">₹{stats.revenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
