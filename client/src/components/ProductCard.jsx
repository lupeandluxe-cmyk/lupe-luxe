import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product, index = 0 }) {
  const hasSale = product.salePrice && product.salePrice < product.price;
  const { addItem } = useCart();

  return (
    <div className="product-card" style={{ '--delay': `${index * 0.08}s` }}>
      <Link to={`/products/${product._id}`} className="product-card-link">
        <div className="product-card-image">
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400'}
            alt={product.name}
            loading="lazy"
          />
          {product.images?.[1] && (
            <img
              src={product.images[1]}
              alt={`${product.name} hover`}
              className="product-card-hover-img"
              loading="lazy"
            />
          )}
          <div className="product-card-badges">
            {hasSale && <span className="badge badge-sale">Sale</span>}
            {product.featured && <span className="badge badge-premium">Premium</span>}
          </div>
        </div>
        <div className="product-card-info">
          <span className="product-card-category">{product.category}</span>
          <h3 className="product-card-name">{product.name}</h3>
          <div className="product-card-meta">
            <span className="product-card-price">
              {hasSale ? (
                <>
                  <span className="price-sale">₹{product.salePrice.toFixed(0)}</span>
                  <span className="price-original">₹{product.price.toFixed(0)}</span>
                </>
              ) : (
                `₹${product.price.toFixed(0)}`
              )}
            </span>
            {product.rating > 0 && (
              <span className="product-card-rating">
                <span className="stars">{'★'.repeat(Math.round(product.rating))}</span>
                <span className="review-count">({product.numReviews})</span>
              </span>
            )}
          </div>
          <button className="card-quick-add" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addItem(product, 1, product.size?.[0] || ''); }}>
            Quick Add +
          </button>
        </div>
      </Link>
    </div>
  );
}