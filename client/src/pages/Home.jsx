import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import HeroBackground from '../components/HeroBackground';
import ReviewForm from '../components/ReviewForm';
import StarRating from '../components/StarRating';

export default function Home() {
  const [sections, setSections] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average: 0, count: 0 });

  const fetchReviews = async () => {
    try {
      const { data } = await api.get('/reviews?limit=6');
      setReviews(data.reviews);
      setReviewStats(data.stats);
    } catch { /* ignore */ }
  };

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
      } catch (err) { /* silent */ }
      finally { setLoading(false); }
    };
    fetchData();
    fetchReviews();
  }, []);

  const renderHero = (sec) => (
    <section className="hero-section" key={sec._id}>
      <div className="hero-glare" />
      <HeroBackground poster={sec.image} />
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-label">{sec.subtitle || 'Chapter I — The Wanderer'}</div>
        <h1 className="hero-title">
          {(sec.title ? sec.title.split('\n') : ['BEYOND', 'THE ORDINARY.']).map((line, i) => (
            <span key={i} className={`hero-line ${i > 0 ? 'hero-line-em' : ''}`}>{line}</span>
          ))}
        </h1>
        <div className="hero-bottom">
          <p className="hero-copy">{sec.text || 'A new expression of clothing.\nBuilt between the wilderness and the city.\nCreated for those writing their own story.'}</p>
          <Link to={sec.buttonLink || '/products'} className="explore-link">
            {sec.buttonText || 'Discover'} ↓
          </Link>
        </div>
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
                {categories.map((cat, i) => (
                  <Link key={cat} to={`/products?category=${encodeURIComponent(cat)}`} className="category-card" style={{ '--delay': `${i * 0.1}s` }}>
                    <span className="category-name">{cat}</span>
                  </Link>
                ))}
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
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                )) : (
                  <>
                    <div className="ethos-card"><h3>Sustainable Thrift</h3><p>Every thrifted piece is a victory against fast fashion.</p></div>
                    <div className="ethos-card"><h3>Handcrafted Art</h3><p>Custom designs hand-applied by our team.</p></div>
                    <div className="ethos-card"><h3>One Piece Inspired</h3><p>For those who chase dreams across the Grand Line.</p></div>
                  </>
                )}
              </div>
            </div>
          </section>
        );
      case 'newsletter':
        return null;
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

      <section className="section editorial-section">
        <div className="container">
          <div className="editorial-grid">
            <div className="editorial-image">
              <img
                src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80"
                alt="Curated streetwear"
                loading="lazy"
              />
            </div>
            <div className="editorial-content">
              <span className="section-subtitle">The Lookbook</span>
              <h2 className="editorial-title">Streetwear Meets Heritage</h2>
              <p className="editorial-text">
                Every piece is crafted for those who move between worlds —
                from late-night sessions to weekend adventures. Premium fabrics,
                bold graphics, and designs that don't follow trends, they set them.
              </p>
              <Link to="/products" className="btn btn-primary">Explore Collection</Link>
            </div>
          </div>
        </div>
      </section>

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
            {reviewStats.count > 0 && (
              <p className="section-desc" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Average: <StarRating rating={reviewStats.average} size={14} /> ({reviewStats.count} review{reviewStats.count > 1 ? 's' : ''})
              </p>
            )}
          </div>
          <div className="testimonials-grid">
            {reviews.length > 0 ? reviews.map((r, i) => (
              <div key={r._id || i} className="testimonial-card" style={{ animationDelay: `${i * 0.15}s`, opacity: 0, animation: 'slideUp 0.6s ease forwards' }}>
                <StarRating rating={r.rating} size={14} />
                {r.title && <p className="testimonial-title">{r.title}</p>}
                <p className="testimonial-text">"{r.text}"</p>
                <p className="testimonial-author">— {r.name}{r.verified ? ' ✓' : ''}</p>
              </div>
            )) : (
              <div className="testimonial-card" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                <p className="testimonial-text">No reviews yet. Be the first to share your experience!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section review-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Share Your Experience</span>
            <h2 className="section-title">Write a Review</h2>
          </div>
          <ReviewForm onSuccess={fetchReviews} />
        </div>
      </section>
    </div>
  );
}
