import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import Loader from '../components/Loader';
import Message from '../components/Message';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState('');
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
        if (data.size?.[0]) setSize(data.size[0]);
        document.title = `${data.name} — Lupe & Luxe`;

        const catRes = await api.get('/products', { params: { category: data.category, page: 1 } });
        setRelated(catRes.data.products.filter((p) => p._id !== data._id).slice(0, 4));
      } catch (err) {
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const handleAdd = () => {
    addItem(product, qty, size);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  if (loading) return <Loader />;
  if (error) return <div className="container"><Message variant="danger">{error}</Message></div>;
  if (!product) return null;

  const images = product.images?.length > 0 ? product.images : ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600'];
  const hasSale = product.salePrice && product.salePrice < product.price;
  const inStock = product.countInStock > 0;

  return (
    <div className="product-detail-page">
      <span className="detail-doodle detail-doodle-1">✧</span>
      <span className="detail-doodle detail-doodle-2">✦</span>
      <span className="detail-doodle detail-doodle-3">♥</span>
      <div className="container">
        <div className="breadcrumbs">
          <Link to="/">Home</Link>
          <span className="breadcrumb-sep">/</span>
          <Link to="/products">Shop</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{product.name}</span>
        </div>

        <div className="product-detail-layout">
          <div className="detail-gallery">
            <div className="detail-main-img">
              <img src={images[selectedImage]} alt={product.name} />
            </div>
            {images.length > 1 && (
              <div className="detail-thumbs">
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`detail-thumb ${i === selectedImage ? 'active' : ''}`}
                    onClick={() => setSelectedImage(i)}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="detail-info">
            <span className="detail-cat">{product.category}</span>
            <h1 className="detail-title">{product.name}</h1>

            <div className="detail-rating">
              <span className="stars">
                {'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}
              </span>
              <span className="detail-rev-count">({product.numReviews} reviews)</span>
            </div>

            <div className="detail-price-row">
              {hasSale ? (
                <>
                  <span className="detail-sale-price">₹{product.salePrice.toFixed(0)}</span>
                  <span className="detail-orig-price">₹{product.price.toFixed(0)}</span>
                  <span className="detail-save-badge">Save ₹{(product.price - product.salePrice).toFixed(0)}</span>
                </>
              ) : (
                <span className="detail-price">₹{product.price.toFixed(0)}</span>
              )}
            </div>

            <p className="detail-desc">{product.description}</p>

            <div className="detail-stock">
              <span className={`detail-stock-badge ${inStock ? 'in-stock' : 'out-of-stock'}`}>
                {inStock ? 'In Stock' : 'Out of Stock'}
              </span>
              {inStock && product.countInStock <= 5 && (
                <span className="detail-stock-warn">Only {product.countInStock} left</span>
              )}
            </div>

            {inStock && (
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

                <div className="qty-add-row">
                  <div className="qty-selector">
                    <label>Qty</label>
                    <div className="qty-controls">
                      <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}>−</button>
                      <span className="qty-value">{qty}</span>
                      <button className="qty-btn" onClick={() => setQty(Math.min(product.countInStock, qty + 1))} disabled={qty >= product.countInStock}>+</button>
                    </div>
                  </div>

                  <button className="btn btn-primary btn-lg add-to-cart-btn" onClick={handleAdd}>
                    {added ? (
                      <>✦ Added!</>
                    ) : (
                      <>Add to Cart — ₹{((hasSale ? product.salePrice : product.price) * qty).toFixed(0)}</>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="detail-tags">
              {product.tags?.map((tag) => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="section">
            <div className="section-head">
              <span className="section-sub">You May Also Like</span>
              <h2 className="section-title">Related Products</h2>
            </div>
            <div className="polaroid-grid">
              {related.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
