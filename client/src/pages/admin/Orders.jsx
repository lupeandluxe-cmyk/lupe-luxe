import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try { const res = await api.get('/orders'); setOrders(res.data); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id, data) => {
    await api.put(`/orders/${id}/status`, data);
    fetchOrders();
  };

  const verifyUpi = async (id, status) => {
    await api.put(`/orders/${id}/upi-verify`, { status });
    fetchOrders();
  };

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-page-content">
      <h1 className="admin-page-title">Orders ({orders.length})</h1>
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th><th>UPI</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td className="order-id-cell" onClick={() => setExpanded(expanded === o._id ? null : o._id)} style={{ cursor: 'pointer' }}>#{o._id?.slice(-8)}</td>
                  <td>{o.user?.name || 'N/A'}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>₹{o.totalPrice}</td>
                  <td>{o.paymentMethod}</td>
                  <td><span className={`badge ${o.orderStatus}`}>{o.orderStatus}</span></td>
                  <td>
                    {o.paymentMethod === 'upi' ? (
                      o.upiPaymentStatus === 'pending' ? <span className="badge warning">Unverified</span> :
                      o.upiPaymentStatus === 'verified' ? <span className="badge success">Verified</span> :
                      o.upiPaymentStatus === 'rejected' ? <span className="badge danger">Rejected</span> : '—'
                    ) : o.isPaid ? <span className="badge success">Paid</span> : <span className="badge muted">—</span>}
                  </td>
                  <td className="action-cell">
                    <select className="form-select-sm" value={o.orderStatus} onChange={e => updateStatus(o._id, { orderStatus: e.target.value })}>
                      <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option><option value="cancelled">Cancelled</option><option value="returned">Returned</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {expanded && (() => {
          const o = orders.find(x => x._id === expanded);
          if (!o) return null;
          return (
            <div className="admin-card order-detail-card">
              <h3>Order #{o._id?.slice(-8).toUpperCase()} — Details</h3>
              <div className="order-detail-grid">
                <div>
                  <strong>Shipping:</strong><br />
                  {o.shippingAddress?.fullName}<br />
                  {o.shippingAddress?.address}<br />
                  {o.shippingAddress?.city} - {o.shippingAddress?.postalCode}<br />
                  📞 {o.shippingAddress?.phone}
                </div>
                <div>
                  <strong>Items:</strong>
                  {o.items?.map((item, i) => (
                    <div key={i} className="order-item-row">
                      <img src={item.image} alt="" className="mini-thumb" />
                      {item.name} × {item.qty} = ₹{item.price * item.qty}
                    </div>
                  ))}
                </div>
                <div>
                  <strong>Totals:</strong> Sub: ₹{o.itemsPrice} | <strong>Total: ₹{o.totalPrice}</strong><br />
                  {o.discount > 0 && <span style={{ color: '#2ecc71' }}>Discount ({o.couponCode}): -₹{o.discount}<br /></span>}

                  {o.paymentMethod === 'upi' && (
                    <div className="upi-verify-section">
                      <strong>UPI TXN ID:</strong> {o.upiTransactionId || 'N/A'}<br />
                      {o.upiScreenshot && (
                        <div className="screenshot-link-wrap">
                          <strong>Screenshot:</strong>{' '}
                          <a href={o.upiScreenshot} target="_blank" rel="noopener noreferrer" className="screenshot-link">📷 View</a>
                        </div>
                      )}
                      <strong>Payment:</strong>{' '}
                      {o.upiPaymentStatus === 'pending' ? (
                        <span className="badge warning">Unverified</span>
                      ) : o.upiPaymentStatus === 'verified' ? (
                        <span className="badge success">Verified</span>
                      ) : o.upiPaymentStatus === 'rejected' ? (
                        <span className="badge danger">Rejected</span>
                      ) : '—'}
                      {o.upiPaymentStatus === 'pending' && (
                        <div className="upi-actions">
                          <button className="btn-sm success" onClick={() => verifyUpi(o._id, 'verified')}>✓ Verify</button>
                          <button className="btn-sm danger" onClick={() => verifyUpi(o._id, 'rejected')}>✗ Reject</button>
                        </div>
                      )}
                    </div>
                  )}

                  {o.paymentMethod === 'razorpay' && (
                    <div>
                      <strong>Razorpay:</strong>{' '}
                      {o.isPaid ? <span className="badge success">Paid</span> : <span className="badge muted">Pending</span>}
                      {o.paymentResult?.id && <div>Payment ID: {o.paymentResult.id}</div>}
                    </div>
                  )}

                  {o.paymentMethod === 'cod' && (
                    <div><strong>COD:</strong> {o.isPaid ? <span className="badge success">Paid</span> : <span className="badge muted">Pending</span>}</div>
                  )}

                  {o.trackingNumber && <div><strong>Tracking:</strong> {o.trackingNumber}</div>}
                  <div><strong>Created:</strong> {new Date(o.createdAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
