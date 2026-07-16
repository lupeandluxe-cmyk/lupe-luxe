import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { internalFetch } from '../../hooks/useInternalAuth';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];

export default function InternalOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const load = () => {
    setLoading(true);
    internalFetch(`/orders?status=${filter}&page=${page}&limit=20`).then(d => {
      setOrders(d.orders || []);
      setTotalPages(d.pages || 1);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter, page]);

  const updateStatus = async (id, orderStatus) => {
    setActionMsg('');
    try {
      await internalFetch(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ orderStatus }),
      });
      load();
      setActionMsg(`Order status updated to ${orderStatus}`);
    } catch { setActionMsg('Failed to update'); }
  };

  if (loading && orders.length === 0) return <div className="internal-loader"><div className="internal-spinner" /></div>;

  return (
    <div>
      <div className="internal-page-header">
        <h2 className="internal-page-title">Orders</h2>
        <div className="internal-filter-group">
          <select className="internal-select" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
            <option value="all">All Orders</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>
      {actionMsg && <div className="internal-alert success">{actionMsg}</div>}
      <div className="internal-card">
        <div className="internal-table-wrap">
          <table className="internal-table">
            <thead>
              <tr>
                <th>Order ID</th><th>Customer</th><th>Items</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td>#{o._id?.slice(-10)}</td>
                  <td>{o.user?.name || o.shippingAddress?.fullName || 'Guest'}<br /><small>{o.user?.email || ''}</small></td>
                  <td>{o.items?.length} items</td>
                  <td>₹{o.totalPrice?.toLocaleString()}</td>
                  <td><span className={`internal-badge ${o.isPaid ? 'paid' : 'unpaid'}`}>{o.paymentMethod?.toUpperCase()} {o.isPaid ? '✅' : '⏳'}</span></td>
                  <td><span className={`internal-badge ${o.orderStatus}`}>{o.orderStatus}</span></td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <select className="internal-select sm" value="" onChange={e => { if (e.target.value) updateStatus(o._id, e.target.value); }}>
                      <option value="">Change Status</option>
                      {STATUSES.map(s => <option key={s} value={s} disabled={s === o.orderStatus}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-dark)' }}>No orders found</p>}
        </div>
        {totalPages > 1 && (
          <div className="internal-pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="internal-btn sm">← Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="internal-btn sm">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
