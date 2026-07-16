import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product, index = 0 }) {
  const hasSale = product.salePrice && product.salePrice < product.price;
  const { addItem } = useCart();

  return (
    <div className="polaroid-card" style={{ '--delay': `${index * 0.08}s` }}>
      <Link to={`/products/${product._id}`} className="polaroid-link">
        <div className="polaroid-img-wrap">
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400'}
            alt={product.name}
            loading="lazy"
          />
          {product.images?.[1] && (
            <img
              src={product.images[1]}
              alt={`${product.name} hover`}
              className="polaroid-hover-img"
              loading="lazy"
            />
          )}
          <div className="polaroid-badges">
            {product.featured && <span className="badge badge-premium">Premium</span>}
            {hasSale && <span className="badge badge-sale">Sale</span>}
            {product.countInStock <= 3 && product.countInStock > 0 && (
              <span className="badge badge-low">Only {product.countInStock} left</span>
            )}
          </div>
          <button className="polaroid-heart" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} aria-label="Wishlist">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
        <div className="polaroid-info">
          <span className="polaroid-cat">{product.category}</span>
          <h3 className="polaroid-name">{product.name}</h3>
          <div className="polaroid-meta">
            <span className="polaroid-price">
              {hasSale ? (
                <>
                  <span className="polaroid-orig">₹{product.price.toFixed(0)}</span>
                  <span className="polaroid-sale">₹{product.salePrice.toFixed(0)}</span>
                </>
              ) : (
                `₹${product.price.toFixed(0)}`
              )}
            </span>
            <span className="polaroid-rating">
              {'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}
              <span className="polaroid-rev">({product.numReviews})</span>
            </span>
          </div>
          <button className="polaroid-add" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addItem(product, 1, product.size?.[0] || ''); }}>
            Quick Add +
          </button>
        </div>
        <span className="polaroid-doodle polaroid-doodle-1">✧</span>
        <span className="polaroid-doodle polaroid-doodle-2">✦</span>
      </Link>
    </div>
  );
}
