import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard').then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-dashboard">
      <h1 className="admin-page-title">Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon-bg">💰</div>
          <div className="stat-info"><span className="stat-label">Total Revenue</span><span className="stat-value">₹{data?.totalSales?.toFixed(2) || '0.00'}</span></div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon-bg">📋</div>
          <div className="stat-info"><span className="stat-label">Total Orders</span><span className="stat-value">{data?.totalOrders || 0}</span></div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon-bg">👥</div>
          <div className="stat-info"><span className="stat-label">Customers</span><span className="stat-value">{data?.totalCustomers || 0}</span></div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon-bg">📦</div>
          <div className="stat-info"><span className="stat-label">Products</span><span className="stat-value">{data?.totalProducts || 0}</span></div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon-bg">⚠️</div>
          <div className="stat-info"><span className="stat-label">Low Stock</span><span className="stat-value">{data?.lowStock || 0}</span></div>
        </div>
      </div>

      {data?.revenueByMonth?.length > 0 && (
        <div className="admin-card">
          <h3>Revenue (Last 12 Months)</h3>
          <div className="chart-container">
            {data.revenueByMonth.map((item, i) => (
              <div key={i} className="chart-bar-wrapper" title={`${item._id}: ₹${item.revenue}`}>
                <div className="chart-bar" style={{ height: `${(item.revenue / Math.max(...data.revenueByMonth.map(r => r.revenue)) * 180)}px` }}></div>
                <span className="chart-label">{item._id?.slice(-2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="admin-card">
          <div className="card-header"><h3>Recent Orders</h3><Link to="/admin/orders" className="card-link">View All</Link></div>
          <table className="admin-table">
            <thead><tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {data?.recentOrders?.map(o => (
                <tr key={o._id}>
                  <td>#{o._id?.slice(-6)}</td>
                  <td>{o.user?.name || 'N/A'}</td>
                  <td>₹{o.totalPrice}</td>
                  <td><span className={`badge ${o.orderStatus || 'pending'}`}>{o.orderStatus || 'pending'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-card">
          <div className="card-header"><h3>Recent Users</h3></div>
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Joined</th></tr></thead>
            <tbody>
              {data?.recentUsers?.map(u => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
