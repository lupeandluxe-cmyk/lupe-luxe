import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

export default function Home() {
  const [sections, setSections] = useState([]);
  const [settings, setSettings] = useState({});
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [secRes, setRes, featRes, latRes, catRes] = await Promise.all([
          api.get('/homepage'),
          api.get('/settings/public'),
          api.get('/products/featured'),
          api.get('/products/latest'),
          api.get('/products/categories'),
        ]);
        setSections(secRes.data);
        setSettings(setRes.data);
        setFeatured(featRes.data);
        setLatest(latRes.data);
        setCategories(catRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const announcement = settings.announcementText || '✦ Free shipping on orders over ₹3,999 ✦';
  const announcementActive = settings.announcementActive !== 'false';

  const renderHero = (sec) => (
    <section className="hero-section" ref={heroRef} key={sec._id}>
      {sec.image && <div className="hero-parallax" style={{ backgroundImage: `url(${sec.image})` }} />}
      <div className="hero-particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{ '--x': `${Math.random() * 100}%`, '--y': `${Math.random() * 100}%`, '--delay': `${Math.random() * 5}s`, '--size': `${Math.random() * 6 + 2}px` }} />
        ))}
      </div>
      <div className="hero-content">
        {sec.subtitle && <div className="hero-badge">{sec.subtitle}</div>}
        {sec.title && (
          <h1 className="hero-title">
            {sec.title.split('\n').map((line, i) => <span key={i} className="hero-line">{line}</span>)}
          </h1>
        )}
        {sec.text && <p className="hero-subtitle">{sec.text}</p>}
        <div className="hero-actions">
          {sec.buttonText && sec.buttonLink && (
            <Link to={sec.buttonLink} className="btn btn-primary btn-lg">
              {sec.buttonText} <span className="btn-arrow">→</span>
            </Link>
          )}
        </div>
        <div className="hero-scroll">
          <span className="scroll-text">Scroll to explore</span>
          <div className="scroll-arrow">↓</div>
        </div>
      </div>
      <div className="hero-features">
        {[{ icon: '✦', label: 'Hand-Selected' }, { icon: '🌿', label: 'Sustainable' }, { icon: '🎨', label: 'Custom Art' }].map((f, i) => (
          <div key={i} className="hero-feature"><span className="feature-icon">{f.icon}</span><span className="feature-label">{f.label}</span></div>
        ))}
      </div>
    </section>
  );

  const renderSection = (sec) => {
    switch (sec.type) {
      case 'hero': return renderHero(sec);
      case 'banner':
        return (
          <section key={sec._id} className="banner-section" style={sec.image ? { backgroundImage: `url(${sec.image})` } : {}}>
            <div className="banner-content">
              {sec.title && <h2 className="banner-title">{sec.title}</h2>}
              {sec.text && <p className="banner-text">{sec.text}</p>}
              {sec.buttonText && sec.buttonLink && <Link to={sec.buttonLink} className="btn btn-primary btn-lg">{sec.buttonText}</Link>}
            </div>
          </section>
        );
      case 'featured':
        return (
          <section key={sec._id} className="section featured-section">
            <div className="container">
              <div className="section-header">
                {sec.subtitle && <span className="section-subtitle">{sec.subtitle}</span>}
                {sec.title && <h2 className="section-title">{sec.title}</h2>}
              </div>
              <div className="products-grid">
                {featured.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
              </div>
            </div>
          </section>
        );
      case 'collection':
        return (
          <section key={sec._id} className="section categories-section">
            <div className="container">
              <div className="section-header">
                {sec.subtitle && <span className="section-subtitle">{sec.subtitle}</span>}
                {sec.title && <h2 className="section-title">{sec.title}</h2>}
                {sec.text && <p className="section-desc">{sec.text}</p>}
              </div>
              <div className="categories-grid">
                {categories.map((cat, i) => {
                  const icons = { 'Custom Tees': '👕', 'Hoodies': '🧥', 'Outerwear': '🧥', 'Sweaters': '👔', 'Thrift Vintage': '📿', 'Limited Drops': '💎', 'Bottoms': '👖', 'Accessories': '🎒' };
                  return (
                    <Link key={cat} to={`/products?category=${encodeURIComponent(cat)}`} className="category-card" style={{ '--delay': `${i * 0.1}s` }}>
                      <span className="category-icon">{icons[cat] || '✦'}</span>
                      <span className="category-name">{cat}</span>
                      <span className="category-arrow">→</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        );
      case 'promo':
        return (
          <section key={sec._id} className="ethos-section">
            <div className="container">
              <div className="ethos-grid">
                {sec.items?.length > 0 ? sec.items.map((item, i) => (
                  <div key={i} className="ethos-card">
                    <span className="ethos-icon">{item.icon || '✦'}</span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                )) : (
                  <>
                    <div className="ethos-card"><span className="ethos-icon">♻️</span><h3>Sustainable Thrift</h3><p>Every thrifted piece is a victory against fast fashion.</p></div>
                    <div className="ethos-card"><span className="ethos-icon">🎨</span><h3>Handcrafted Art</h3><p>Custom designs hand-applied by our team.</p></div>
                    <div className="ethos-card"><span className="ethos-icon">🌊</span><h3>One Piece Inspired</h3><p>For those who chase dreams across the Grand Line.</p></div>
                  </>
                )}
              </div>
            </div>
          </section>
        );
      case 'announcement':
        return (
          <section key={sec._id} className="announcement-bar">
            <div className="container">
              <p>{sec.text || sec.title}</p>
            </div>
          </section>
        );
      case 'newsletter':
        return (
          <section key={sec._id} className="newsletter-section">
            <div className="container">
              <div className="newsletter-content">
                <h2>{sec.title || 'Stay Updated'}</h2>
                <p>{sec.text || 'Get notified about new drops and exclusive offers.'}</p>
              </div>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="home-page">
      {announcementActive && (
        <div className="top-bar"><span className="top-bar-text">{announcement}</span></div>
      )}

      {sections.map(s => renderSection(s))}

      {sections.filter(s => s.type === 'featured').length === 0 && (
        <section className="section featured-section">
          <div className="container">
            <div className="section-header">
              <span className="section-subtitle">Premium Picks</span>
              <h2 className="section-title">Featured Pieces</h2>
            </div>
            <div className="products-grid">
              {featured.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}

      <section className="section latest-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Fresh Drop</span>
            <h2 className="section-title">Just Arrived</h2>
          </div>
          <div className="products-grid">
            {latest.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
          <div className="section-action">
            <Link to="/products" className="btn btn-outline">View All Products →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
