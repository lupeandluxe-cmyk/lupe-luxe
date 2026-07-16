import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Message from '../components/Message';

export default function Cart() {
  const { items, removeItem, itemsPrice, discount, discountCode, totalPrice, applyCoupon, removeCoupon } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const { data } = await api.post('/coupons/validate', { code: couponInput.trim(), orderTotal: itemsPrice });
      if (data.valid) {
        applyCoupon(data);
        setCouponSuccess(`Coupon "${data.code}" applied! You save ₹${data.discount.toFixed(0)}`);
        setCouponInput('');
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponSuccess('');
  };

  const handleCheckout = () => {
    if (!user) navigate('/login?redirect=/checkout');
    else navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-empty">
            <span className="cart-empty-icon">🛒</span>
            <h2>Your cart is empty</h2>
            <p>Ready to find something special?</p>
            <Link to="/products" className="btn btn-primary btn-lg">
              Start Shopping →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <span className="cart-doodle cart-doodle-1">✦</span>
      <span className="cart-doodle cart-doodle-2">✧</span>
      <span className="cart-doodle cart-doodle-3">♥</span>
      <div className="container">
        <div className="cart-head">
          <h1 className="cart-title">Shopping Cart</h1>
          <span className="cart-count">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.product} className="cart-row">
                <Link to={`/products/${item.product}`} className="cart-row-img">
                  <img src={item.image} alt={item.name} />
                </Link>
                <div className="cart-row-info">
                  <Link to={`/products/${item.product}`} className="cart-row-name">{item.name}</Link>
                  {item.size && <span className="cart-row-size">Size: {item.size}</span>}
                  <span className="cart-row-price">₹{item.price.toFixed(0)}</span>
                </div>
                <div className="cart-row-qty">
                  <span className="cart-qty-badge">×{item.qty}</span>
                </div>
                <div className="cart-row-total">
                  ₹{(item.price * item.qty).toFixed(0)}
                </div>
                <button className="cart-row-remove" onClick={() => removeItem(item.product)} aria-label="Remove item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            ))}
          </div>

          <div className="cart-side">
            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="cart-summary-rows">
                <div className="cart-summary-row">
                  <span>Subtotal</span>
                  <span>₹{itemsPrice.toFixed(0)}</span>
                </div>
                {discount > 0 && (
                  <div className="cart-summary-row cart-summary-discount">
                    <span>Discount ({discountCode})</span>
                    <span>-₹{discount.toFixed(0)}</span>
                  </div>
                )}
                <div className="cart-summary-divider" />
                <div className="cart-summary-row cart-summary-total">
                  <span>Total</span>
                  <span>₹{totalPrice.toFixed(0)}</span>
                </div>
              </div>

              <div className="cart-coupon">
                {discountCode ? (
                  <div className="cart-coupon-applied">
                    <span>✅ {discountCode} applied — save ₹{discount.toFixed(0)}</span>
                    <button className="cart-coupon-remove" onClick={handleRemoveCoupon}>✕</button>
                  </div>
                ) : (
                  <>
                    <div className="cart-coupon-input">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <button onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}>
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <Message variant="danger">{couponError}</Message>}
                    {couponSuccess && <Message variant="success">{couponSuccess}</Message>}
                  </>
                )}
              </div>

              <button className="btn btn-primary btn-block btn-lg" onClick={handleCheckout}>
                Proceed to Checkout — ₹{totalPrice.toFixed(0)}
              </button>
              <Link to="/products" className="cart-continue">← Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
