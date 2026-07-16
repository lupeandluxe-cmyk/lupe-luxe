import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { internalFetch } from '../../hooks/useInternalAuth';

export default function InternalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    internalFetch('/dashboard').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="internal-loader"><div className="internal-spinner" /></div>;

  const stats = data?.stats || {};
  const cards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: '📦', color: '#d4af37' },
    { label: 'Today', value: stats.todayOrders, icon: '📅', color: '#2ecc71' },
    { label: 'Pending', value: stats.pendingOrders, icon: '⏳', color: '#e74c3c' },
    { label: 'Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: '#3498db' },
    { label: 'Unread', value: stats.unreadNotifications, icon: '🔔', color: '#f39c12' },
  ];

  return (
    <div>
      <h2 className="internal-page-title">Dashboard</h2>
      <div className="internal-stats-grid">
        {cards.map(c => (
          <div key={c.label} className="internal-stat-card" style={{ borderLeftColor: c.color }}>
            <span className="internal-stat-icon">{c.icon}</span>
            <div>
              <p className="internal-stat-value">{c.value ?? '-'}</p>
              <p className="internal-stat-label">{c.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="internal-dashboard-grid">
        <div className="internal-card">
          <div className="internal-card-header">
            <h3>Recent Orders</h3>
            <Link to="/admin/internal/orders" className="internal-link">View All →</Link>
          </div>
          <div className="internal-table-wrap">
            <table className="internal-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {(data?.recentOrders || []).slice(0, 5).map(o => (
                  <tr key={o._id}>
                    <td>#{o._id?.slice(-8)}</td>
                    <td>{o.user?.name || 'Guest'}</td>
                    <td>₹{o.totalPrice?.toLocaleString()}</td>
                    <td><span className={`internal-badge ${o.orderStatus}`}>{o.orderStatus}</span></td>
                  </tr>
                ))}
                {(data?.recentOrders || []).length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1rem', color: 'var(--gray-dark)' }}>No orders yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="internal-card">
          <div className="internal-card-header">
            <h3>Pending Tasks</h3>
            <Link to="/admin/internal/tasks" className="internal-link">View All →</Link>
          </div>
          <div className="internal-task-list">
            {(data?.pendingTasks || []).slice(0, 5).map(t => (
              <div key={t._id} className="internal-task-item">
                <span className={`internal-task-priority ${t.priority}`} />
                <div>
                  <p className="internal-task-title">{t.title}</p>
                  <p className="internal-task-meta">{t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No deadline'} · {t.status}</p>
                </div>
              </div>
            ))}
            {(data?.pendingTasks || []).length === 0 && <p style={{ padding: '1rem', color: 'var(--gray-dark)', textAlign: 'center' }}>No pending tasks</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
