import { Link } from 'react-router-dom';

export default function ProductCard({ product, index = 0 }) {
  return (
    <div className="product-card" style={{ '--delay': `${index * 0.1}s` }}>
      <div className="product-card-inner">
        <Link to={`/products/${product._id}`} className="product-image-wrap">
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400'}
            alt={product.name}
            className="product-image"
            loading="lazy"
          />
          <div className="product-overlay">
            <span className="quick-view">Quick View</span>
          </div>
          {product.featured && <span className="badge-premium">✦ Premium</span>}
          {product.countInStock <= 5 && product.countInStock > 0 && (
            <span className="badge-low">Low Stock</span>
          )}
        </Link>
        <div className="product-info">
          <span className="product-category">{product.category}</span>
          <Link to={`/products/${product._id}`} className="product-name">
            {product.name}
          </Link>
          <div className="product-meta">
            <span className="product-price">₹{product.price.toFixed(2)}</span>
            <div className="product-rating">
              <span className="stars">
                {'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
