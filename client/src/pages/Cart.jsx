import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Message from '../components/Message';

export default function Cart() {
  const { items, removeItem, itemsPrice, discount, discountCode, shippingPrice, taxPrice, totalPrice, applyCoupon, removeCoupon } = useCart();
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
        <div className="container cart-empty">
          <div className="empty-icon-lg">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Ready to find something special?</p>
          <Link to="/products" className="btn btn-primary btn-lg">
            Start Shopping →
          </Link>
        </div>
      </div>
    );
  }

  const freeShippingRemaining = 3999 - (itemsPrice - discount);

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1 className="page-title">Shopping Cart</h1>
          <span className="cart-item-count">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.product} className="cart-item">
                <Link to={`/products/${item.product}`} className="cart-item-img-wrap">
                  <img src={item.image} alt={item.name} className="cart-item-img" />
                </Link>
                <div className="cart-item-info">
                  <Link to={`/products/${item.product}`} className="cart-item-name">{item.name}</Link>
                  {item.size && <span className="cart-item-size">Size: {item.size}</span>}
                  <span className="cart-item-price">₹{item.price.toFixed(0)}</span>
                </div>
                <div className="cart-item-qty">
                  <span className="qty-badge">×{item.qty}</span>
                </div>
                <div className="cart-item-total">
                  ₹{(item.price * item.qty).toFixed(0)}
                </div>
                <button className="cart-remove-btn" onClick={() => removeItem(item.product)} aria-label="Remove item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            ))}

            {freeShippingRemaining > 0 && !discountCode && (
              <div className="free-shipping-notice">
                Add ₹{freeShippingRemaining.toFixed(0)} more for <strong>free shipping</strong>
              </div>
            )}
          </div>

          <div className="cart-sidebar">
            <div className="cart-summary-card">
              <h3>Order Summary</h3>
              <div className="summary-rows">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{itemsPrice.toFixed(0)}</span>
                </div>
                {discount > 0 && (
                  <div className="summary-row discount-row">
                    <span>Discount ({discountCode})</span>
                    <span>-₹{discount.toFixed(0)}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Shipping</span>
                  <span className={shippingPrice === 0 ? 'free' : ''}>
                    {shippingPrice === 0 ? 'FREE' : `₹${shippingPrice.toFixed(0)}`}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Tax (12%)</span>
                  <span>₹{taxPrice.toFixed(0)}</span>
                </div>
                <div className="summary-divider" />
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹{totalPrice.toFixed(0)}</span>
                </div>
              </div>

              <div className="coupon-section">
                {discountCode ? (
                  <div className="coupon-applied">
                    <span>✅ {discountCode} applied — save ₹{discount.toFixed(0)}</span>
                    <button className="coupon-remove-btn" onClick={handleRemoveCoupon}>✕</button>
                  </div>
                ) : (
                  <>
                    <div className="coupon-input-wrap">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        className="coupon-input"
                      />
                      <button className="coupon-apply-btn" onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}>
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <Message variant="danger">{couponError}</Message>}
                    {couponSuccess && <Message variant="success">{couponSuccess}</Message>}
                  </>
                )}
              </div>

              <button className="btn btn-primary btn-block btn-lg checkout-btn" onClick={handleCheckout}>
                Proceed to Checkout — ₹{totalPrice.toFixed(0)}
              </button>
              <Link to="/products" className="continue-shopping">← Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
