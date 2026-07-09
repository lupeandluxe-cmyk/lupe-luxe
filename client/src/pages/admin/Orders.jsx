import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Loader from '../../components/Loader';
import Message from '../../components/Message';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (err) { setError('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const markDelivered = async (id) => {
    try {
      await api.put(`/orders/${id}/deliver`);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const toggleExpand = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  if (loading) return <Loader />;

  return (
    <div className="admin-page">
      <div className="container">
        <h1 className="page-title">📋 Manage Orders</h1>
        {error && <Message variant="danger">{error}</Message>}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <>
                  <tr key={o._id} className="order-main-row" onClick={() => toggleExpand(o._id)}>
                    <td className="expand-cell">
                      <span className={`expand-icon ${expanded === o._id ? 'open' : ''}`}>▶</span>
                    </td>
                    <td className="order-id-cell">#{o._id.slice(-8).toUpperCase()}</td>
                    <td>
                      <strong>{o.user?.name || 'N/A'}</strong>
                      <br /><span className="order-email">{o.shippingAddress?.fullName || ''}</span>
                    </td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="text-center">{o.items?.length || 0}</td>
                    <td className="text-bold">₹{o.totalPrice.toFixed(2)}</td>
                    <td>
                      <span className={o.isPaid ? 'badge-success' : 'badge-muted'}>
                        {o.isPaid ? 'Paid' : 'COD'}
                      </span>
                    </td>
                    <td>
                      <span className={o.isDelivered ? 'badge-success' : 'badge-warning'}>
                        {o.isDelivered ? 'Delivered' : 'Processing'}
                      </span>
                    </td>
                    <td>
                      {!o.isDelivered && (
                        <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); markDelivered(o._id); }}>
                          Mark Delivered
                        </button>
                      )}
                      {o.isDelivered && <span className="text-success">✓</span>}
                    </td>
                  </tr>
                  {expanded === o._id && (
                    <tr key={`${o._id}-detail`} className="order-detail-row">
                      <td colSpan={9}>
                        <div className="order-expanded">
                          <div className="expanded-grid">
                            <div className="expanded-section">
                              <h4>📍 Shipping Address</h4>
                              <p><strong>{o.shippingAddress?.fullName}</strong></p>
                              <p>{o.shippingAddress?.address}</p>
                              <p>{o.shippingAddress?.city}, {o.shippingAddress?.postalCode}</p>
                              <p>{o.shippingAddress?.country}</p>
                              {o.shippingAddress?.phone && <p>📞 {o.shippingAddress.phone}</p>}
                            </div>
                            <div className="expanded-section">
                              <h4>💳 Payment Details</h4>
                              <p>Method: {o.paymentMethod === 'razorpay' ? 'Online (Razorpay)' : 'Cash on Delivery'}</p>
                              <p>Status: {o.isPaid ? `✅ Paid on ${new Date(o.paidAt).toLocaleDateString()}` : '⏳ Pending'}</p>
                              {o.paymentResult?.id && <p className="payment-id">ID: {o.paymentResult.id}</p>}
                              <h4 style={{ marginTop: '1rem' }}>📦 Delivery</h4>
                              <p>Status: {o.isDelivered ? `✅ Delivered on ${new Date(o.deliveredAt).toLocaleDateString()}` : '🚚 Processing'}</p>
                            </div>
                            <div className="expanded-section">
                              <h4>💰 Order Totals</h4>
                              <div className="summary-row"><span>Items</span><span>₹{o.itemsPrice.toFixed(2)}</span></div>
                              <div className="summary-row"><span>Shipping</span><span>₹{o.shippingPrice.toFixed(2)}</span></div>
                              <div className="summary-row"><span>Tax (GST)</span><span>₹{o.taxPrice.toFixed(2)}</span></div>
                              <div className="summary-divider" style={{ margin: '0.3rem 0' }}></div>
                              <div className="summary-row total"><span>Total</span><span>₹{o.totalPrice.toFixed(2)}</span></div>
                            </div>
                          </div>
                          <div className="expanded-items">
                            <h4>🛒 Ordered Items ({o.items?.length || 0})</h4>
                            <div className="items-table-wrap">
                              <table className="items-table">
                                <thead>
                                  <tr>
                                    <th>Product</th>
                                    <th>Name</th>
                                    <th>Size</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th>Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {o.items?.map((item, i) => (
                                    <tr key={i}>
                                      <td className="item-img-cell">
                                        <img src={item.image} alt={item.name} className="item-thumb" />
                                      </td>
                                      <td className="item-name-cell">{item.name}</td>
                                      <td>{item.size || 'N/A'}</td>
                                      <td className="text-center">{item.qty}</td>
                                      <td>₹{item.price.toFixed(2)}</td>
                                      <td className="text-bold">₹{(item.qty * item.price).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
