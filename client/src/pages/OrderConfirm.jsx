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
        image: '/favicon.svg',
        order_id: orderRes.data.id,
        handler: async (response) => {
          try {
            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: o._id,
            });
            setOrder({ ...o, isPaid: true, paidAt: new Date().toISOString() });
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
              <p>Status: <span className={order.isPaid ? 'text-success' : 'text-muted'}>{order.isPaid ? `Paid on ${new Date(order.paidAt).toLocaleDateString()}` : 'Pending'}</span></p>
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
              <div className="summary-row"><span>Shipping</span><span>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice.toFixed(0)}`}</span></div>
              <div className="summary-row"><span>Tax</span><span>₹{order.taxPrice.toFixed(0)}</span></div>
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
