import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import Reveal from '../components/Reveal';

export default function Wishlist() {
  const { items, removeWishlist } = useWishlist();

  return (
    <div className="shop-page">
      <div className="shop-header">
        <div className="container">
          <div className="shop-header-content">
            <div>
              <p className="eyebrow">Saved pieces</p>
              <h1 className="shop-title">Wishlist</h1>
              <p className="shop-count">{items.length} {items.length === 1 ? 'piece' : 'pieces'} saved</p>
            </div>
            <Link to="/products" className="btn btn-outline">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>

      <div className="container section-tight">
        {items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">♡</span>
            <h3>Your wishlist is empty</h3>
            <p>Tap the heart on any piece to save it here.</p>
            <Link to="/products" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Shop new arrivals
            </Link>
          </div>
        ) : (
          <div className="products-grid">
            {items.map((product, index) => (
              <Reveal key={product._id} delay={Math.min(index * 0.05, 0.3)}>
                <div style={{ position: 'relative' }}>
                  <ProductCard product={product} index={0} />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '0.6rem', width: '100%' }}
                    onClick={() => removeWishlist(product._id)}
                  >
                    Remove
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
