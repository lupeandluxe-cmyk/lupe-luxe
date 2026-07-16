import { useState, useEffect } from 'react';
import { internalFetch } from '../../hooks/useInternalAuth';

export default function InternalReports() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    internalFetch('/dashboard').then(d => {
      if (d.stats) {
        setTotalRevenue(d.stats.totalRevenue || 0);
        setTotalOrders(d.stats.totalOrders || 0);
      }
      setOrders(d.recentOrders || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="internal-loader"><div className="internal-spinner" /></div>;

  return (
    <div>
      <h2 className="internal-page-title">Reports</h2>
      <div className="internal-stats-grid" style={{ marginTop: '1rem' }}>
        <div className="internal-stat-card" style={{ borderLeftColor: '#d4af37' }}>
          <span className="internal-stat-icon">💰</span>
          <div>
            <p className="internal-stat-value">₹{totalRevenue.toLocaleString()}</p>
            <p className="internal-stat-label">Total Revenue</p>
          </div>
        </div>
        <div className="internal-stat-card" style={{ borderLeftColor: '#3498db' }}>
          <span className="internal-stat-icon">📦</span>
          <div>
            <p className="internal-stat-value">{totalOrders}</p>
            <p className="internal-stat-label">Total Orders</p>
          </div>
        </div>
        <div className="internal-stat-card" style={{ borderLeftColor: '#2ecc71' }}>
          <span className="internal-stat-icon">✅</span>
          <div>
            <p className="internal-stat-value">{orders.filter(o => o.orderStatus === 'delivered').length}</p>
            <p className="internal-stat-label">Delivered</p>
          </div>
        </div>
        <div className="internal-stat-card" style={{ borderLeftColor: '#e74c3c' }}>
          <span className="internal-stat-icon">❌</span>
          <div>
            <p className="internal-stat-value">{orders.filter(o => o.orderStatus === 'cancelled').length}</p>
            <p className="internal-stat-label">Cancelled</p>
          </div>
        </div>
      </div>
    </div>
  );
}
