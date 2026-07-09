import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import Message from '../components/Message';

export default function Checkout() {
  const { items, clearCart, itemsPrice, shippingPrice, taxPrice, totalPrice } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', address: '', city: '', postalCode: '', country: 'India', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [upiTxnId, setUpiTxnId] = useState('');
  const [settings, setSettings] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings/public').then(res => setSettings(res.data)).catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (paymentMethod === 'upi' && !upiTxnId.trim()) {
      setError('Please enter the UPI Transaction ID');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/orders', {
        items: items.map((i) => ({ product: i.product, name: i.name, qty: i.qty, price: i.price, image: i.image, size: i.size || '' })),
        shippingAddress: form,
        paymentMethod,
        itemsPrice, shippingPrice, taxPrice, totalPrice,
        upiTransactionId: paymentMethod === 'upi' ? upiTxnId : undefined,
      });
      clearCart();
      navigate(`/order/${data._id}${paymentMethod === 'razorpay' ? '?pay=1' : ''}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Order failed');
    } finally {
      setSaving(false);
    }
  };

  if (items.length === 0) { navigate('/cart'); return null; }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="page-title">Checkout</h1>
        {error && <Message variant="danger">{error}</Message>}

        <div className="checkout-layout">
          <form onSubmit={handleSubmit} className="checkout-form">
            <h2>Shipping Address</h2>
            <div className="form-group"><label>Full Name</label><input name="fullName" value={form.fullName} onChange={handleChange} required /></div>
            <div className="form-group"><label>Address</label><input name="address" value={form.address} onChange={handleChange} required /></div>
            <div className="form-row">
              <div className="form-group"><label>City</label><input name="city" value={form.city} onChange={handleChange} required /></div>
              <div className="form-group"><label>Postal Code</label><input name="postalCode" value={form.postalCode} onChange={handleChange} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Country</label><input name="country" value={form.country} onChange={handleChange} required /></div>
              <div className="form-group"><label>Phone</label><input name="phone" value={form.phone} onChange={handleChange} /></div>
            </div>

            <h2>Payment Method</h2>
            <div className="payment-methods">
              <label className={`payment-option ${paymentMethod === 'razorpay' ? 'active' : ''}`}>
                <input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
                <span className="payment-option-content"><span className="payment-icon">💳</span><span><strong>Online Payment</strong><small>UPI, Card, Net Banking, Wallet</small></span></span>
              </label>
              <label className={`payment-option ${paymentMethod === 'upi' ? 'active' : ''}`}>
                <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                <span className="payment-option-content"><span className="payment-icon">📱</span><span><strong>UPI QR Payment</strong><small>Scan & Pay via GPay, PhonePe, PayTM</small></span></span>
              </label>
              <label className={`payment-option ${paymentMethod === 'cod' ? 'active' : ''}`}>
                <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                <span className="payment-option-content"><span className="payment-icon">💵</span><span><strong>Cash on Delivery</strong><small>Pay when you receive</small></span></span>
              </label>
            </div>

            {paymentMethod === 'upi' && (
              <div className="upi-section">
                <div className="upi-qr-container">
                  {settings.upiQrImage ? (
                    <img src={settings.upiQrImage} alt="UPI QR Code" className="upi-qr-image" />
                  ) : (
                    <div className="upi-qr-placeholder">QR code not set. Contact support.</div>
                  )}
                  <p className="upi-instruction">Scan the QR code to complete the payment.</p>
                  {settings.upiId && <p className="upi-id">UPI ID: <strong>{settings.upiId}</strong></p>}
                  {settings.upiHolderName && <p className="upi-holder">Pay to: {settings.upiHolderName}</p>}
                </div>
                <div className="form-group">
                  <label>UPI Transaction ID (UTR)</label>
                  <input placeholder="Enter the transaction ID after payment" value={upiTxnId} onChange={e => setUpiTxnId(e.target.value)} required />
                  <small>After payment, enter the UPI Transaction Reference Number here</small>
                </div>
                <Message variant="info">After placing the order, it will remain <strong>Pending Payment Verification</strong> until we verify your payment. This usually takes a few minutes.</Message>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={saving}>
              {saving ? 'Placing Order...' : `${paymentMethod === 'razorpay' ? 'Pay' : paymentMethod === 'upi' ? 'Place Order (UPI)' : 'Place Order'} — ₹${totalPrice.toFixed(2)}`}
            </button>
          </form>

          <div className="checkout-summary">
            <h3>Order Summary</h3>
            {items.map((item) => (
              <div key={item.product} className="checkout-item">
                <img src={item.image} alt={item.name} />
                <div>
                  <p className="checkout-item-name">{item.name}</p>
                  {item.size && <p className="checkout-item-size">Size: {item.size}</p>}
                  <p className="checkout-item-sub">×{item.qty} — ₹{(item.price * item.qty).toFixed(2)}</p>
                </div>
              </div>
            ))}
            <div className="summary-divider"></div>
            <div className="summary-row"><span>Subtotal</span><span>₹{itemsPrice.toFixed(2)}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{shippingPrice === 0 ? 'FREE' : `₹${shippingPrice.toFixed(2)}`}</span></div>
            <div className="summary-row"><span>Tax</span><span>₹{taxPrice.toFixed(2)}</span></div>
            <div className="summary-divider"></div>
            <div className="summary-row total"><span>Total</span><span>₹{totalPrice.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
