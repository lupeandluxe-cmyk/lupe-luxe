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
    <section className="hero" ref={heroRef} key={sec._id}>
      <span className="doodle-star" style={{top:'12%',left:'6%',animationDelay:'0s'}}>✦</span>
      <span className="doodle-star md" style={{top:'20%',right:'10%',animationDelay:'1.2s'}}>✧</span>
      <span className="doodle-star sm" style={{bottom:'35%',left:'4%',animationDelay:'2s'}}>✦</span>
      <span className="doodle-heart" style={{top:'42%',right:'6%',animationDelay:'0.7s'}}>♥</span>
      <span className="doodle-circle" style={{top:'55%',right:'12%'}} />
      <span className="doodle-sparkle" style={{bottom:'25%',right:'22%',animationDelay:'1.5s'}}>⚡</span>
      <span className="doodle-cloud" style={{top:'18%',left:'55%',animationDelay:'0.3s'}}>☁</span>
      <span className="doodle-cloud" style={{bottom:'30%',left:'70%',animationDelay:'2.5s',fontSize:'1.8rem'}}>☁</span>
      <span className="doodle-arrow" style={{bottom:'22%',left:'12%',animationDelay:'1s'}}>↗</span>
      <HeroBackground poster={sec.image} />
      <div className="hero-grid container">
        <div className="hero-text">
          <div className="hero-badge">{sec.subtitle || 'Premium Streetwear'}</div>
          {sec.title && (
            <h1 className="hero-title">
              {sec.title.split('\n').map((line, i) => <span key={i} className="hero-line">{line}</span>)}
            </h1>
          )}
          {sec.text && <p className="hero-paragraph">{sec.text}</p>}
          <div className="hero-tagline-wrap">
            {sec.buttonText && sec.buttonLink ? (
              <Link to={sec.buttonLink} className="btn btn-primary btn-lg">
                {sec.buttonText}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
            ) : (
              <Link to="/products" className="btn btn-primary btn-lg">
                Explore Collection
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
            )}
          </div>
        </div>
        <div className="hero-img-wrap">
          <div className="hero-sticky-note">
            <span className="hero-sticky-fold" />
            <p>New drops every week! ✨</p>
          </div>
        </div>
      </div>
      <div className="hero-scroll">
        <span>Scroll</span>
        <div className="hero-scroll-line" />
      </div>
      <span className="hero-doodle-line" />
    </section>
  );

  const renderSection = (sec) => {
    switch (sec.type) {
      case 'hero': return renderHero(sec);
      case 'banner':
        return (
          <section key={sec._id} className="banner" style={sec.image ? { backgroundImage: `url(${sec.image})` } : {}}>
            <div className="container">
              <div className="banner-content">
                <span className="banner-doodle">✦</span>
                {sec.title && <h2 className="banner-title">{sec.title}</h2>}
                {sec.text && <p className="banner-desc">{sec.text}</p>}
                {sec.buttonText && sec.buttonLink && <Link to={sec.buttonLink} className="btn btn-primary btn-lg">{sec.buttonText}</Link>}
              </div>
            </div>
          </section>
        );
      case 'featured':
        return (
          <section key={sec._id} className="section">
            <div className="container">
              <div className="section-head">
                {sec.subtitle && <span className="section-sub">{sec.subtitle}</span>}
                {sec.title && <h2 className="section-title">{sec.title}</h2>}
              </div>
              <div className="polaroid-grid">
                {featured.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
              </div>
            </div>
          </section>
        );
      case 'collection':
        return (
          <section key={sec._id} className="section">
            <div className="container">
              <div className="section-head">
                {sec.subtitle && <span className="section-sub">{sec.subtitle}</span>}
                {sec.title && <h2 className="section-title">{sec.title}</h2>}
                {sec.text && <p className="section-desc">{sec.text}</p>}
              </div>
              <div className="categories-grid">
                {categories.map((cat, i) => {
                  const icons = { 'Custom Tees': '👕', 'Hoodies': '🧥', 'Outerwear': '🧥', 'Sweaters': '👔', 'Thrift Vintage': '📿', 'Limited Drops': '💎', 'Bottoms': '👖', 'Accessories': '🎒' };
                  return (
                    <Link key={cat} to={`/products?category=${encodeURIComponent(cat)}`} className="cat-card" style={{ '--delay': `${i * 0.1}s` }}>
                      <span className="cat-icon">{icons[cat] || '✦'}</span>
                      <span className="cat-name">{cat}</span>
                      <span className="cat-doodle">✧</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        );
      case 'promo':
        return (
          <section key={sec._id} className="section">
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
          <section key={sec._id} className="newsletter">
            <div className="container">
              <div className="newsletter-content">
                <span className="newsletter-doodle">✧</span>
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
        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="section-sub">Premium Picks</span>
              <h2 className="section-title">Featured Pieces</h2>
            </div>
            <div className="polaroid-grid">
              {featured.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="section-sub">Fresh Drop</span>
            <h2 className="section-title">Just Arrived</h2>
          </div>
          <div className="polaroid-grid">
            {latest.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
          <div className="section-action">
            <Link to="/products" className="btn btn-outline">View All Products →</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="section-sub">What They Say</span>
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
          <div className="section-head">
            <span className="section-sub">Follow the Journey</span>
            <h2 className="section-title">@LupeAndLuxe</h2>
          </div>
          <div className="insta-grid">
            {INSTA_POSTS.map((img, i) => (
              <a key={i} href="#" className="insta-item" onClick={(e) => e.preventDefault()}>
                <img src={img} alt="Gallery" loading="lazy" />
                <div className="insta-overlay">
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
