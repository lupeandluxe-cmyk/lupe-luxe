import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import Loader from '../components/Loader';
import Message from '../components/Message';

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
        if (data.size?.[0]) setSize(data.size[0]);
      } catch (err) {
        setError('Treasure not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAdd = () => {
    addItem(product, qty, size);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  if (loading) return <Loader />;
  if (error) return <div className="container"><Message variant="danger">{error}</Message></div>;
  if (!product) return null;

  return (
    <div className="product-detail-page">
      <div className="container">
        <Link to="/products" className="breadcrumb">← Back to Shop</Link>

        <div className="product-detail">
          <div className="detail-gallery">
            <div className="detail-image-main">
              <img src={product.images?.[0]} alt={product.name} />
            </div>
          </div>

          <div className="detail-info">
            <span className="detail-category">{product.category}</span>
            <h1 className="detail-title">{product.name}</h1>

            <div className="detail-rating">
              <span className="stars">
                {'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}
              </span>
              <span className="review-count">({product.numReviews} reviews)</span>
            </div>

            <p className="detail-price">₹{product.price.toFixed(2)}</p>
            <p className="detail-desc">{product.description}</p>

            <div className="detail-tags">
              {product.tags?.map((tag) => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
            </div>

            <div className="detail-stock">
              <span className={`stock-indicator ${product.countInStock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {product.countInStock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
              {product.countInStock <= 5 && product.countInStock > 0 && (
                <span className="stock-warning">Only {product.countInStock} left</span>
              )}
            </div>

            {product.countInStock > 0 && (
              <div className="detail-actions">
                {product.size?.[0] && product.size[0] !== 'One Size' && (
                  <div className="size-selector">
                    <label>Size</label>
                    <div className="size-options">
                      {product.size.map((s) => (
                        <button
                          key={s}
                          className={`size-btn ${size === s ? 'active' : ''}`}
                          onClick={() => setSize(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="qty-add">
                  <div className="qty-selector">
                    <label>Qty</label>
                    <select value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                      {[...Array(Math.min(product.countInStock, 10)).keys()].map((x) => (
                        <option key={x + 1} value={x + 1}>{x + 1}</option>
                      ))}
                    </select>
                  </div>

                  <button className="btn btn-primary btn-lg add-btn" onClick={handleAdd}>
                    {added ? '✦ Added to Cart!' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            )}

            <div className="detail-shipping">
              <span>🚚 Free shipping on orders over ₹3,999</span>
              <span>🔄 Easy returns within 30 days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
