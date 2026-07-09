import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { items, removeItem, itemsPrice, shippingPrice, taxPrice, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) navigate('/login?redirect=/checkout');
    else navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container cart-empty">
          <div className="empty-animation">🛒</div>
          <h2>Your sea chest is empty</h2>
          <p>Time to find some treasure!</p>
          <Link to="/products" className="btn btn-primary btn-lg">
            Start Shopping →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1 className="page-title">Your Sea Chest</h1>
          <span className="cart-count">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.product} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <Link to={`/products/${item.product}`} className="cart-item-name">
                    {item.name}
                  </Link>
                  {item.size && <span className="cart-item-size">Size: {item.size}</span>}
                  <p className="cart-item-price">₹{item.price.toFixed(2)} each</p>
                </div>
                <div className="cart-item-qty">
                  <span className="qty-label">×{item.qty}</span>
                </div>
                <div className="cart-item-total">
                  ₹{(item.price * item.qty).toFixed(2)}
                </div>
                <button className="remove-btn" onClick={() => removeItem(item.product)} title="Remove">
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-rows">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{itemsPrice.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span className={shippingPrice === 0 ? 'free' : ''}>
                  {shippingPrice === 0 ? 'FREE' : `₹${shippingPrice.toFixed(2)}`}
                </span>
              </div>
              <div className="summary-row">
                <span>Tax</span>
                <span>₹{taxPrice.toFixed(2)}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>
            {itemsPrice < 3999 && (
              <div className="free-shipping-note">
                Add ₹{(3999 - itemsPrice).toFixed(2)} more for free shipping!
              </div>
            )}
            <button className="btn btn-primary btn-block btn-lg" onClick={handleCheckout}>
              Proceed to Checkout →
            </button>
            <Link to="/products" className="continue-shopping">← Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
