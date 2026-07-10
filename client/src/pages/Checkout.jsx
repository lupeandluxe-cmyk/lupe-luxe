import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import Message from '../components/Message';

const PAYMENT_OPTIONS = [
  { value: 'razorpay', label: 'Online Payment', sub: 'UPI, Card, Net Banking', icon: '💳', setting: 'razorpayEnabled' },
  { value: 'upi', label: 'UPI QR', sub: 'GPay, PhonePe, PayTM', icon: '📱', setting: 'upiEnabled' },
  { value: 'cod', label: 'Cash on Delivery', sub: 'Pay when delivered', icon: '💵', setting: 'codEnabled' },
];

export default function Checkout() {
  const { items, clearCart, itemsPrice, discount, discountCode, totalPrice } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', address: '', city: '', postalCode: '', country: 'India', phone: '' });
  const [errors, setErrors] = useState({});
  const [settings, setSettings] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [upiTxnId, setUpiTxnId] = useState('');
  const [upiScreenshot, setUpiScreenshot] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const { applyCoupon, removeCoupon } = useCart();

  useEffect(() => {
    api.get('/settings/public').then(({ data }) => {
      setSettings(data);
      const enabledOptions = PAYMENT_OPTIONS.filter(o => data[o.setting] !== 'false');
      if (enabledOptions.length > 0 && !enabledOptions.find(o => o.value === paymentMethod)) {
        setPaymentMethod(enabledOptions[0].value);
      }
    }).catch(() => {});
  }, []);

  const enabledMethods = PAYMENT_OPTIONS.filter(o => settings[o.setting] !== 'false');

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.address.trim()) e.address = 'Required';
    if (!form.city.trim()) e.city = 'Required';
    if (!form.postalCode.trim()) e.postalCode = 'Required';
    if (!form.phone.trim()) e.phone = 'Required';
    else if (!/^[+]?[\d\s-]{10,15}$/.test(form.phone)) e.phone = 'Invalid phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const { data } = await api.post('/coupons/validate', { code: couponInput.trim(), orderTotal: itemsPrice });
      if (data.valid) {
        applyCoupon(data);
        setCouponSuccess(`"${data.code}" applied — save ₹${data.discount.toFixed(0)}`);
        setCouponInput('');
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'upi');
    try {
      const { data } = await api.post('/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUpiScreenshot(data.url);
    } catch {
      setError('Screenshot upload failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (paymentMethod === 'upi') {
      if (!upiTxnId.trim()) { setError('Please enter the UPI Transaction ID'); return; }
      if (!upiScreenshot) { setError('Please upload the payment screenshot'); return; }
    }
    setSaving(true);
    try {
      const { data } = await api.post('/orders', {
        items: items.map((i) => ({ product: i.product, name: i.name, qty: i.qty, price: i.price, image: i.image, size: i.size || '' })),
        shippingAddress: form,
        paymentMethod,
        itemsPrice, discount, couponCode: discountCode,
        totalPrice,
        ...(paymentMethod === 'upi' ? { upiTransactionId: upiTxnId.trim(), upiScreenshot } : {}),
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
            <div className="checkout-section">
              <h2 className="checkout-section-title">Shipping Address</h2>
              <div className="form-group">
                <label>Full Name</label>
                <input name="fullName" value={form.fullName} onChange={handleChange} className={errors.fullName ? 'input-error' : ''} placeholder="Enter your full name" required />
                {errors.fullName && <span className="field-error">{errors.fullName}</span>}
              </div>
              <div className="form-group">
                <label>Address</label>
                <input name="address" value={form.address} onChange={handleChange} className={errors.address ? 'input-error' : ''} placeholder="Street address, apartment, etc." required />
                {errors.address && <span className="field-error">{errors.address}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input name="city" value={form.city} onChange={handleChange} className={errors.city ? 'input-error' : ''} placeholder="City" required />
                  {errors.city && <span className="field-error">{errors.city}</span>}
                </div>
                <div className="form-group">
                  <label>Postal Code</label>
                  <input name="postalCode" value={form.postalCode} onChange={handleChange} className={errors.postalCode ? 'input-error' : ''} placeholder="PIN code" required />
                  {errors.postalCode && <span className="field-error">{errors.postalCode}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Country</label>
                  <input name="country" value={form.country} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className={errors.phone ? 'input-error' : ''} placeholder="10-digit number" required />
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                </div>
              </div>
            </div>

            <div className="checkout-section">
              <h2 className="checkout-section-title">Payment Method</h2>
              <div className="payment-methods">
                {enabledMethods.map(m => (
                  <label key={m.value} className={`payment-option ${paymentMethod === m.value ? 'active' : ''}`}>
                    <input type="radio" name="payment" value={m.value} checked={paymentMethod === m.value} onChange={() => setPaymentMethod(m.value)} />
                    <span className="payment-option-content">
                      <span className="payment-icon">{m.icon}</span>
                      <span><strong>{m.label}</strong><small>{m.sub}</small></span>
                    </span>
                  </label>
                ))}
                {enabledMethods.length === 0 && (
                  <Message variant="warning">No payment methods are currently enabled.</Message>
                )}
              </div>

              {paymentMethod === 'upi' && (
                <div className="upi-section">
                  <div className="upi-qr-container">
                    {settings.upiQrImage ? (
                      <img src={settings.upiQrImage} alt="UPI QR Code" className="upi-qr-image" />
                    ) : (
                      <div className="upi-qr-placeholder">QR not set</div>
                    )}
                    {settings.upiId && <p className="upi-id">UPI ID: <strong>{settings.upiId}</strong></p>}
                    {settings.upiHolderName && <p className="upi-holder">Pay to: {settings.upiHolderName}</p>}
                  </div>
                  <div className="form-group">
                    <label>UPI Transaction ID (UTR)</label>
                    <input placeholder="Enter the UTR after payment" value={upiTxnId} onChange={e => setUpiTxnId(e.target.value)} required />
                    <small>Enter the UPI Transaction Reference Number after payment</small>
                  </div>
                  <div className="form-group">
                    <label>Payment Screenshot</label>
                    <div className="screenshot-upload-area">
                      {upiScreenshot ? (
                        <div className="screenshot-preview">
                          <img src={upiScreenshot} alt="Payment Screenshot" />
                          <button type="button" className="screenshot-remove" onClick={() => setUpiScreenshot(null)}>✕</button>
                        </div>
                      ) : (
                        <label className="screenshot-upload-btn">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          <span>Upload Screenshot</span>
                          <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleScreenshotUpload} />
                        </label>
                      )}
                    </div>
                    <small>Upload a screenshot of your UPI payment (PNG, JPG, or WebP)</small>
                  </div>
                  <Message variant="info">After placing the order, it will remain <strong>Pending Verification</strong> until we verify your UPI payment.</Message>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg checkout-submit" disabled={saving || enabledMethods.length === 0}>
              {saving ? 'Placing Order...' : `Place Order — ₹${totalPrice.toFixed(0)}`}
            </button>
          </form>

          <div className="checkout-sidebar">
            <div className="checkout-summary-card">
              <h3>Order Summary</h3>
              <div className="checkout-items-preview">
                {items.slice(0, 3).map((item) => (
                  <div key={item.product} className="checkout-item">
                    <img src={item.image} alt={item.name} />
                    <div className="checkout-item-detail">
                      <p className="checkout-item-name">{item.name}</p>
                      {item.size && <p className="checkout-item-size">Size: {item.size}</p>}
                      <p className="checkout-item-sub">×{item.qty} — ₹{(item.price * item.qty).toFixed(0)}</p>
                    </div>
                  </div>
                ))}
                {items.length > 3 && <p className="checkout-more-items">+{items.length - 3} more items</p>}
              </div>
              <div className="summary-divider" />
              <div className="summary-rows">
                <div className="summary-row"><span>Subtotal</span><span>₹{itemsPrice.toFixed(0)}</span></div>
                {discount > 0 && (
                  <div className="summary-row discount-row">
                    <span>Discount ({discountCode})</span>
                    <span>-₹{discount.toFixed(0)}</span>
                  </div>
                )}
                <div className="summary-divider" />
                <div className="summary-row total"><span>Total</span><span>₹{totalPrice.toFixed(0)}</span></div>
              </div>

              <div className="coupon-section">
                {discountCode ? (
                  <div className="coupon-applied">
                    <span>✅ {discountCode} applied</span>
                    <button className="coupon-remove-btn" onClick={removeCoupon}>✕</button>
                  </div>
                ) : (
                  <>
                    <div className="coupon-input-wrap">
                      <input type="text" placeholder="Coupon code" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()} className="coupon-input" />
                      <button className="coupon-apply-btn" onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}>{couponLoading ? '...' : 'Apply'}</button>
                    </div>
                    {couponError && <Message variant="danger">{couponError}</Message>}
                    {couponSuccess && <Message variant="success">{couponSuccess}</Message>}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
