import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/Loader';
import Message from '../components/Message';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function OrderConfirm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [newUtr, setNewUtr] = useState('');
  const [newScreenshot, setNewScreenshot] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data);
        if (searchParams.get('pay') === '1' && data.paymentMethod === 'razorpay' && !data.isPaid) {
          setTimeout(() => handlePay(data), 500);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchOrder();
  }, [id]);

  const handlePay = async (orderData) => {
    const o = orderData || order;
    if (!o) return;
    setPaying(true);
    setPayError('');
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setPayError('Failed to load Razorpay. Please try again.');
        setPaying(false);
        return;
      }
      const keyRes = await api.get('/payment/key');
      const orderRes = await api.post('/payment/razorpay', { orderId: o._id });
      const options = {
        key: keyRes.data.key,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        name: 'Lupe & Luxe',
        description: `Order #${o._id.slice(-10).toUpperCase()}`,
        image: '/logo.jpeg',
        order_id: orderRes.data.id,
        handler: async (response) => {
          try {
            const { data } = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: o._id,
            });
            setOrder(data.order);
          } catch (err) {
            setPayError('Payment verification failed. Please contact support.');
          }
          setPaying(false);
        },
        modal: { ondismiss: () => setPaying(false) },
        prefill: { name: o.shippingAddress?.fullName, contact: o.shippingAddress?.phone || '' },
        theme: { color: '#d4af37' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setPayError(err.response?.data?.message || 'Payment failed');
      setPaying(false);
    }
  };

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPayError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/upload/upi', fd);
      setNewScreenshot(data.url);
    } catch (err) {
      setPayError(err.response?.data?.message || 'Screenshot upload failed');
    }
  };

  const handleRetryUpi = async () => {
    if (!newUtr.trim()) return;
    setRetrying(true);
    setPayError('');
    try {
      const body = { upiTransactionId: newUtr.trim() };
      if (newScreenshot) body.upiScreenshot = newScreenshot;
      const { data } = await api.put(`/orders/${id}/upi-retry`, body);
      setOrder(data);
      setNewUtr('');
      setNewScreenshot(null);
    } catch (err) {
      setPayError(err.response?.data?.message || 'Failed to resubmit');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) return <Loader />;
  if (!order) return <Message variant="danger">Order not found</Message>;

  return (
    <div className="order-page">
      <div className="container">
        <div className="order-confirm">
          <div className="confirm-icon">☠</div>
          <h1>Thank you, Captain!</h1>
          <p className="confirm-sub">Your order has been placed successfully.</p>
          <div className="confirm-badge">
            Order #{order._id.slice(-10).toUpperCase()}
          </div>
        </div>

        {payError && <Message variant="danger">{payError}</Message>}

        {order.paymentMethod === 'razorpay' && !order.isPaid && (
          <div className="pay-now-banner">
            <p>💳 Complete your payment to confirm the order</p>
            <button className="btn btn-primary btn-lg" onClick={() => handlePay()} disabled={paying}>
              {paying ? 'Opening Payment...' : `Pay ₹${order.totalPrice.toFixed(0)} Now`}
            </button>
          </div>
        )}

        {order.paymentMethod === 'razorpay' && order.isPaid && (
          <div className="pay-now-banner upi-verified-banner">
            <p>✅ <strong>Payment Successful</strong></p>
            <p className="banner-sub">Your Razorpay payment has been verified automatically. Your order is confirmed!</p>
          </div>
        )}

        {order.paymentMethod === 'upi' && order.upiPaymentStatus === 'pending' && (
          <div className="pay-now-banner upi-pending-banner">
            <p>⏳ <strong>Payment Pending Verification</strong></p>
            <p className="banner-sub">We have received your UPI transaction (UTR: <strong>{order.upiTransactionId}</strong>). Your order will be confirmed once we verify the payment.</p>
            {order.upiScreenshot && (
              <div className="screenshot-link-wrap">
                <a href={order.upiScreenshot} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">View Screenshot</a>
              </div>
            )}
          </div>
        )}

        {order.paymentMethod === 'upi' && order.upiPaymentStatus === 'verified' && (
          <div className="pay-now-banner upi-verified-banner">
            <p>✅ <strong>Payment Verified</strong></p>
            <p className="banner-sub">Your UPI payment has been verified. Your order is confirmed!</p>
          </div>
        )}

        {order.paymentMethod === 'upi' && order.upiPaymentStatus === 'rejected' && (
          <div className="pay-now-banner upi-rejected-banner">
            <p>❌ <strong>Payment Verification Failed</strong></p>
            <p className="banner-sub">The UTR you provided could not be verified. Please submit the correct details below.</p>
            <div className="upi-retry-form">
              <input type="text" placeholder="Enter correct UPI Transaction ID (UTR)" value={newUtr} onChange={(e) => setNewUtr(e.target.value)} className="coupon-input" />
              <div className="screenshot-upload-area">
                {newScreenshot ? (
                  <div className="screenshot-preview sm">
                    <img src={newScreenshot} alt="Screenshot" />
                    <button type="button" className="screenshot-remove" onClick={() => setNewScreenshot(null)}>✕</button>
                  </div>
                ) : (
                  <label className="screenshot-upload-btn sm">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleScreenshotUpload} />
                  </label>
                )}
              </div>
              <button className="btn btn-primary" onClick={handleRetryUpi} disabled={retrying || !newUtr.trim()}>
                {retrying ? 'Submitting...' : 'Resubmit'}
              </button>
            </div>
          </div>
        )}

        <div className="order-detail-layout">
          <div className="order-main">
            <div className="order-card">
              <h3>📍 Shipping To</h3>
              <p><strong>{order.shippingAddress.fullName}</strong></p>
              <p>{order.shippingAddress.address}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && <p>📞 {order.shippingAddress.phone}</p>}
            </div>

            <div className="order-card">
              <h3>💳 Payment</h3>
              <p>{order.paymentMethod === 'razorpay' ? 'Online (Razorpay)' : order.paymentMethod === 'upi' ? 'UPI' : 'Cash on Delivery'}</p>
              {order.paymentMethod === 'upi' && order.upiTransactionId && <p>UTR: <strong>{order.upiTransactionId}</strong></p>}
              {order.paymentMethod === 'upi' && order.upiScreenshot && (
                <p><a href={order.upiScreenshot} target="_blank" rel="noopener noreferrer" className="screenshot-link">📷 View Screenshot</a></p>
              )}
              <p>Status: {upiStatusBadge(order)}</p>
              {order.isPaid && order.paidAt && <p className="payment-id">Paid on {new Date(order.paidAt).toLocaleDateString()}</p>}
              {order.isPaid && order.paymentResult?.id && <p className="payment-id">ID: {order.paymentResult.id}</p>}
            </div>

            <div className="order-card">
              <h3>📦 Items</h3>
              {order.items.map((item) => (
                <div key={item.product} className="order-item">
                  <img src={item.image} alt={item.name} />
                  <div>
                    <Link to={`/products/${item.product}`}>{item.name}</Link>
                    {item.size && <p className="item-size">Size: {item.size}</p>}
                    <p className="item-sub">×{item.qty} — ₹{(item.qty * item.price).toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-sidebar">
            <div className="summary-card">
              <h3>Summary</h3>
              <div className="summary-row"><span>Items</span><span>₹{order.itemsPrice.toFixed(0)}</span></div>
              {order.discount > 0 && (
                <div className="summary-row discount-row"><span>Discount ({order.couponCode})</span><span>-₹{order.discount.toFixed(0)}</span></div>
              )}
              <div className="summary-divider" />
              <div className="summary-row total"><span>Total</span><span>₹{order.totalPrice.toFixed(0)}</span></div>
            </div>
            <Link to="/products" className="btn btn-outline btn-block">Continue Exploring →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function upiStatusBadge(order) {
  if (order.paymentMethod === 'upi' && order.upiPaymentStatus) {
    if (order.upiPaymentStatus === 'verified') return <span className="badge success">Payment Verified</span>;
    if (order.upiPaymentStatus === 'rejected') return <span className="badge danger">Payment Failed</span>;
    if (order.upiPaymentStatus === 'pending') return <span className="badge warning">Pending Verification</span>;
  }
  if (order.isPaid) return <span className="badge success">Paid</span>;
  return <span className="badge muted">Pending</span>;
}
