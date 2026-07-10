import { Link } from 'react-router-dom';

export default function ProductCard({ product, index = 0 }) {
  const hasSale = product.salePrice && product.salePrice < product.price;

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
            {product.featured && <span className="badge badge-premium">Premium</span>}
            {hasSale && <span className="badge badge-sale">Sale</span>}
            {product.countInStock <= 3 && product.countInStock > 0 && (
              <span className="badge badge-low">Only {product.countInStock} left</span>
            )}
          </div>
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
              <span className="stars">
                {'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}
              </span>
              <span className="review-count">({product.numReviews})</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
