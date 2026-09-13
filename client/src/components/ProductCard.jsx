import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import StarRating from './StarRating';

function isNewProduct(product) {
  if (!product.createdAt) return false;
  const created = new Date(product.createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created < 30 * 24 * 60 * 60 * 1000;
}

export default function ProductCard({ product, index = 0 }) {
  const hasSale = product.salePrice && product.salePrice < product.price;
  const inStock = (product.countInStock ?? 0) > 0;
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const saved = isWishlisted(product._id);

  return (
    <div className="product-card" style={{ '--delay': `${index * 0.08}s` }}>
      <Link to={`/products/${product._id}`} className="product-card-link" aria-label={product.name}>
        <div className="product-card-image">
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80&auto=format&fit=crop'}
            alt={product.name}
            loading="lazy"
          />
          {product.images?.[1] && (
            <img
              src={product.images[1]}
              alt=""
              aria-hidden="true"
              className="product-card-hover-img"
              loading="lazy"
            />
          )}
          <div className="product-card-badges">
            {isNewProduct(product) && <span className="badge badge-premium">New</span>}
            {product.bestSeller && <span className="badge badge-premium">Bestseller</span>}
            {hasSale && <span className="badge badge-sale">Sale</span>}
            {inStock && product.countInStock <= 3 && (
              <span className="badge badge-low">Only {product.countInStock} left</span>
            )}
            {!inStock && <span className="badge badge-low">Sold out</span>}
          </div>
          <button
            type="button"
            className={`wishlist-btn ${saved ? 'active' : ''}`}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 20.7C6.4 17.2 3 13.6 3 9.9 3 7.2 5.1 5 7.8 5c1.7 0 3.2.9 4.2 2.3C13 5.9 14.5 5 16.2 5 18.9 5 21 7.2 21 9.9c0 3.7-3.4 7.3-9 10.8z" />
            </svg>
          </button>
        </div>
        <div className="product-card-info">
          <span className="product-card-category">{product.category}</span>
          <h3 className="product-card-name">{product.name}</h3>
          <div className="product-card-meta">
            <span className="product-card-price">
              {hasSale ? (
                <>
                  <span className="price-original">₹{product.price.toFixed(0)}</span>
                  <span className="price-sale">₹{product.salePrice.toFixed(0)}</span>
                </>
              ) : (
                `₹${product.price.toFixed(0)}`
              )}
            </span>
            <div className="product-card-rating">
              <StarRating rating={product.rating} size={12} />
              <span className="review-count">({product.numReviews})</span>
            </div>
          </div>
          <button
            className="card-quick-add"
            disabled={!inStock}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!inStock) return;
              addItem(product, 1, product.size?.[0] || '');
            }}
          >
            {inStock ? 'Quick Add +' : 'Sold Out'}
          </button>
        </div>
      </Link>
    </div>
  );
}
