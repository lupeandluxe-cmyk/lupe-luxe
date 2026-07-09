import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [feat, lat, cats] = await Promise.all([
          api.get('/products/featured'),
          api.get('/products/latest'),
          api.get('/products/categories'),
        ]);
        setFeatured(feat.data);
        setLatest(lat.data);
        setCategories(cats.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="home-page">
      <section className="hero-section" ref={heroRef}>
        <div className="hero-parallax"></div>
        <div className="hero-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`,
              '--delay': `${Math.random() * 5}s`,
              '--size': `${Math.random() * 6 + 2}px`,
            }} />
          ))}
        </div>
        <div className="hero-content">
          <div className="hero-badge">New Collection</div>
          <h1 className="hero-title">
            <span className="hero-line">Sail the</span>
            <span className="hero-line accent">Grand Line</span>
            <span className="hero-line">in Style</span>
          </h1>
          <p className="hero-subtitle">
            Premium thrift &amp; custom clothing — each piece carries the spirit of adventure.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary btn-lg">
              Explore Collection
              <span className="btn-arrow">→</span>
            </Link>
            <Link to="/products?category=Limited+Drops" className="btn btn-outline btn-lg">
              Limited Drops
            </Link>
          </div>
          <div className="hero-scroll">
            <span className="scroll-text">Scroll to explore</span>
            <div className="scroll-arrow">↓</div>
          </div>
        </div>
        <div className="hero-features">
          {[
            { icon: '✦', label: 'Hand-Selected' },
            { icon: '🌿', label: 'Sustainable' },
            { icon: '🎨', label: 'Custom Art' },
          ].map((f, i) => (
            <div key={i} className="hero-feature">
              <span className="feature-icon">{f.icon}</span>
              <span className="feature-label">{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section categories-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Collections</span>
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-desc">Find your next treasure</p>
          </div>
          <div className="categories-grid">
            {categories.map((cat, i) => {
              const icons = {
                'Custom Tees': '👕',
                'Hoodies': '🧥',
                'Outerwear': '🧥',
                'Sweaters': '👔',
                'Thrift Vintage': '📿',
                'Limited Drops': '💎',
                'Bottoms': '👖',
                'Accessories': '🎒',
              };
              return (
                <Link
                  key={cat}
                  to={`/products?category=${encodeURIComponent(cat)}`}
                  className="category-card"
                  style={{ '--delay': `${i * 0.1}s` }}
                >
                  <span className="category-icon">{icons[cat] || '✦'}</span>
                  <span className="category-name">{cat}</span>
                  <span className="category-arrow">→</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section featured-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Premium Picks</span>
            <h2 className="section-title">Featured Pieces</h2>
          </div>
          <div className="products-grid">
            {featured.map((p, i) => (
              <ProductCard key={p._id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="banner-section">
        <div className="banner-content">
          <span className="banner-tag">Limited Edition</span>
          <h2 className="banner-title">Gear Fifth Drop</h2>
          <p className="banner-text">The Drums of Liberation are calling. Exclusive chrome collection.</p>
          <Link to="/products?keyword=Gear+Fifth" className="btn btn-primary btn-lg">
            Secure Yours
          </Link>
        </div>
      </section>

      <section className="section latest-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Fresh Drop</span>
            <h2 className="section-title">Just Arrived</h2>
          </div>
          <div className="products-grid">
            {latest.map((p, i) => (
              <ProductCard key={p._id} product={p} index={i} />
            ))}
          </div>
          <div className="section-action">
            <Link to="/products" className="btn btn-outline">
              View All Products →
            </Link>
          </div>
        </div>
      </section>

      <section className="ethos-section">
        <div className="container">
          <div className="ethos-grid">
            <div className="ethos-card">
              <span className="ethos-icon">♻️</span>
              <h3>Sustainable Thrift</h3>
              <p>Every thrifted piece is a victory against fast fashion.</p>
            </div>
            <div className="ethos-card">
              <span className="ethos-icon">🎨</span>
              <h3>Handcrafted Art</h3>
              <p>Custom designs hand-applied by our team.</p>
            </div>
            <div className="ethos-card">
              <span className="ethos-icon">🌊</span>
              <h3>One Piece Inspired</h3>
              <p>For those who chase dreams across the Grand Line.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
