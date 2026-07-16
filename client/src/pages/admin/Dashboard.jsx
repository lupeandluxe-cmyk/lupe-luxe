import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const STORAGE_KEY = 'll_revenue_reset';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [revenueReset, setRevenueReset] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
  });
  const { user } = useAuth();
  const isCEO = user?.isAdmin;

  useEffect(() => {
    api.get('/reports/dashboard').then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleResetRevenue = () => {
    const log = {
      adminName: user?.name || 'Unknown',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      resetAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    setRevenueReset(log);
    setShowConfirm(false);
    setData(prev => prev ? { ...prev, totalSales: 0, revenueByMonth: [] } : prev);
  };

  const handleRecalculate = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRevenueReset(null);
    api.get('/reports/dashboard').then(res => setData(res.data)).catch(() => {});
  };

  const displayRevenue = revenueReset ? 0 : (data?.totalSales || 0);
  const displayRevenueByMonth = revenueReset ? [] : (data?.revenueByMonth || []);

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-dashboard">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <h1 className="admin-page-title" style={{ margin: 0 }}>Dashboard</h1>
        {isCEO && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {revenueReset && (
              <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }} onClick={handleRecalculate}>
                ↻ Recalculate Revenue
              </button>
            )}
            <button className="btn btn-sm btn-danger" style={{ background: '#c0392b', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.7rem', padding: '0.45rem 0.85rem' }} onClick={() => setShowConfirm(true)}>
              Reset Revenue
            </button>
          </div>
        )}
      </div>

      {revenueReset && (
        <div style={{ fontSize: '0.75rem', color: 'var(--gray-dark)', marginBottom: '0.75rem', padding: '0.4rem 0.75rem', background: 'rgba(192,57,43,0.08)', borderRadius: 'var(--radius)', display: 'inline-block' }}>
          ⚠ Revenue was reset on {revenueReset.date} at {revenueReset.time} by {revenueReset.adminName}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon-bg">💰</div>
          <div className="stat-info"><span className="stat-label">Total Revenue</span><span className="stat-value">₹{displayRevenue.toFixed(2)}</span></div>
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

      {displayRevenueByMonth.length > 0 && (
        <div className="admin-card">
          <h3>Revenue (Last 12 Months)</h3>
          <div className="chart-container">
            {displayRevenueByMonth.map((item, i) => (
              <div key={i} className="chart-bar-wrapper" title={`${item._id}: ₹${item.revenue}`}>
                <div className="chart-bar" style={{ height: `${(item.revenue / Math.max(...displayRevenueByMonth.map(r => r.revenue)) * 180)}px` }}></div>
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

      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }} onClick={() => setShowConfirm(false)}>
          <div style={{
            background: '#111', border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius)', padding: '2rem', maxWidth: '480px',
            width: '90%', textAlign: 'center'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 0.75rem' }}>Reset Revenue?</h3>
            <p style={{ color: 'var(--gray)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Are you sure you want to reset the revenue amount? This action will only reset the displayed revenue statistics and will <strong>NOT</strong> delete any orders, products, customers, or payment records.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.6rem 1.5rem' }} onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-sm btn-danger" style={{ background: '#c0392b', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', padding: '0.6rem 1.5rem' }} onClick={handleResetRevenue}>Reset Revenue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
