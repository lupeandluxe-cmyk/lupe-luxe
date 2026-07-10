import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import HeroBackground from '../components/HeroBackground';

const TESTIMONIALS = [
  { name: 'Roronoa Zoro', text: '"The quality of this hoodie is insane. Lost my way finding the store, but totally worth it."', stars: 5 },
  { name: 'Nami', text: '"Finally, a brand that understands luxury thrift. My wallet cries but my wardrobe sings!"', stars: 5 },
  { name: 'Sanji', text: '"Custom tee came out perfect. The fabric is premium — would expect nothing less for the Grand Line."', stars: 5 },
];

const INSTA_POSTS = [
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&q=80',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&q=80',
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80',
  'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&q=80',
  'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300&q=80',
];

export default function Home() {
  const [sections, setSections] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [secRes, featRes, latRes, catRes] = await Promise.all([
          api.get('/homepage'),
          api.get('/products/featured'),
          api.get('/products/latest'),
          api.get('/products/categories'),
        ]);
        setSections(secRes.data);
        setFeatured(featRes.data);
        setLatest(latRes.data);
        setCategories(catRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const renderHero = (sec) => (
    <section className="hero-section" ref={heroRef} key={sec._id}>
      <div className="hero-glare" />
      <HeroBackground poster={sec.image} />
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-glass">
          <div className="hero-badge">{sec.subtitle || 'Premium Streetwear'}</div>
          {sec.title && (
            <h1 className="hero-title">
              {sec.title.split('\n').map((line, i) => <span key={i} className="hero-line">{line}</span>)}
            </h1>
          )}
          {sec.text && <p className="hero-subtitle">{sec.text}</p>}
          <div className="hero-actions">
            {sec.buttonText && sec.buttonLink ? (
              <Link to={sec.buttonLink} className="btn btn-primary btn-lg">
                {sec.buttonText}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
            ) : (
              <Link to="/products" className="btn btn-primary btn-lg">
                Explore Collection
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="hero-scroll-indicator">
        <span>Scroll</span>
        <div className="hero-scroll-line" />
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

      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">What They Say</span>
            <h2 className="section-title">Voices of the Crew</h2>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card" style={{ animationDelay: `${i * 0.15}s`, opacity: 0, animation: 'slideUp 0.6s ease forwards' }}>
                <div className="testimonial-stars">{'★'.repeat(t.stars)}</div>
                <p className="testimonial-text">{t.text}</p>
                <p className="testimonial-author">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Follow the Journey</span>
            <h2 className="section-title">@LupeAndLuxe</h2>
          </div>
          <div className="insta-grid">
            {INSTA_POSTS.map((img, i) => (
              <a key={i} href="#" className="insta-item" onClick={(e) => e.preventDefault()}>
                <img src={img} alt="Gallery" loading="lazy" />
                <div className="insta-item-overlay">
                  <span className="insta-icon">📷</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
