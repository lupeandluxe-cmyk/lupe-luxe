import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import ReviewForm from '../components/ReviewForm';
import StarRating from '../components/StarRating';
import NewsletterSignup from '../components/NewsletterSignup';
import Reveal from '../components/Reveal';

const IMG = {
  hero: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1000&q=80&auto=format&fit=crop',
  boys: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&q=80&auto=format&fit=crop',
  girls: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=300&q=80&auto=format&fit=crop',
  jewels: 'https://images.unsplash.com/photo-1606318801954-d46d46d3360a?w=300&q=80&auto=format&fit=crop',
  accessories: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300&q=80&auto=format&fit=crop',
  women: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=700&q=80&auto=format&fit=crop',
  men: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=700&q=80&auto=format&fit=crop',
  tote: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&q=80&auto=format&fit=crop',
  social: [
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&q=80&auto=format&fit=crop',
  ],
};

const CIRCLES = [
  { label: 'Boys', to: '/products?audience=boys', image: IMG.boys, alt: 'Boys edit' },
  { label: 'Girls', to: '/products?audience=girls', image: IMG.girls, alt: 'Girls edit' },
  { label: 'Jewels', to: '/products?audience=jewels', image: IMG.jewels, alt: 'Jewels and charms' },
  { label: 'Accessories', to: '/products?audience=accessories', image: IMG.accessories, alt: 'Accessories' },
];

const COLLECTIONS = [
  { title: 'Women', text: 'Soft knits, relaxed fits and everyday staples.', to: '/products?audience=women', image: IMG.women, alt: 'Women collection' },
  { title: 'Men', text: 'Outerwear, hoodies and statement layers.', to: '/products?audience=men', image: IMG.men, alt: 'Men collection' },
  { title: 'Jewels', text: 'Charms and finishing touches with a luxe edge.', to: '/products?audience=jewels', image: IMG.jewels, alt: 'Jewels collection' },
  { title: 'Accessories', text: 'Caps, totes, hats and carry-everywhere pieces.', to: '/products?audience=accessories', image: IMG.tote, alt: 'Accessories collection' },
];

function hasSale(product) {
  return product.salePrice && product.salePrice < product.price;
}

function uniqueProducts(lists) {
  const map = new Map();
  lists.flat().forEach((product) => {
    if (product && product._id && !map.has(product._id)) map.set(product._id, product);
  });
  return [...map.values()];
}

function CategoryCircles() {
  return (
    <div className="category-circles" role="list" aria-label="Shop by category">
      {CIRCLES.map((circle) => (
        <Link key={circle.label} to={circle.to} className="circle-link" role="listitem">
          <span className="circle-image">
            <img src={circle.image} alt={circle.alt} loading="lazy" width="148" height="148" />
          </span>
          <span className="circle-name">{circle.label}</span>
        </Link>
      ))}
    </div>
  );
}

function ShopHero({ eyebrow, titleLines, text, ctaText, ctaLink, image, imageAlt }) {
  return (
    <section className="hero-section hero-shop" aria-label="Featured collection">
      <div className="container hero-grid">
        <div className="hero-copy hero-content">
          <span className="hero-eyebrow hero-label">{eyebrow}</span>
          <h1 className="hero-title">
            {titleLines.map((line, index) => (
              <span key={index} className={`hero-line ${index > 0 ? 'hero-line-em' : ''}`}>
                {line}
              </span>
            ))}
          </h1>
          <p className="hero-sub hero-copy">{text}</p>
          <div className="hero-ctas hero-bottom">
            <Link to={ctaLink} className="explore-link">
              {ctaText}
            </Link>
            <Link to="/products?audience=accessories" className="hero-secondary-link">
              Shop accessories
            </Link>
          </div>
          <CategoryCircles />
        </div>
        <div className="hero-media">
          <div className="hero-image-card">
            <img src={image} alt={imageAlt} fetchPriority="high" width="1000" height="1250" />
            <div className="hero-media-badge">
              <span>
                New Season <strong>· 2026</strong>
              </span>
              <span>Easy 7-day returns</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [sections, setSections] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [jewelProducts, setJewelProducts] = useState([]);
  const [accessoryProducts, setAccessoryProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [site, setSite] = useState({});
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average: 0, count: 0 });

  const fetchReviews = async () => {
    try {
      const { data } = await api.get('/reviews?limit=6');
      setReviews(data.reviews);
      setReviewStats(data.stats);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [secRes, featRes, latRes, bestRes, catRes, jewelRes, accRes] = await Promise.all([
          api.get('/homepage'),
          api.get('/products/featured'),
          api.get('/products/latest'),
          api.get('/products/best-sellers'),
          api.get('/products/categories'),
          api.get('/products', { params: { audience: 'jewels', page: 1 } }),
          api.get('/products', { params: { audience: 'accessories', page: 1 } }),
        ]);
        setSections(secRes.data);
        setFeatured(featRes.data);
        setLatest(latRes.data);
        setBestSellers(bestRes.data);
        setCategories(catRes.data);
        setJewelProducts(jewelRes.data.products || []);
        setAccessoryProducts(accRes.data.products || []);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    fetchReviews();
    api
      .get('/settings/public')
      .then(({ data }) => setSite(data || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading && window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading]);

  if (loading) return <Loader text="Loading new arrivals..." />;

  const catalog = uniqueProducts([featured, latest, bestSellers]);
  const saleItems = catalog.filter(hasSale).slice(0, 4);
  const jewelItems = jewelProducts.slice(0, 4);
  const accessoryItems = accessoryProducts.slice(0, 4);
  const instagramUrl = site.instagramUrl || site.instagram || '';
  const contactEmail = site.contactEmail || '';

  const renderHero = (sec) => (
    <ShopHero
      key={sec._id}
      eyebrow={sec.subtitle || 'New Season · 2026'}
      titleLines={sec.title ? sec.title.split('\n') : ['Elevate Your', 'Everyday.']}
      text={sec.text || 'Considered essentials, premium thrift finds and handcrafted details — designed to elevate the everyday.'}
      ctaText={sec.buttonText || 'Shop New Arrivals'}
      ctaLink={sec.buttonLink || '/products?sort=latest'}
      image={sec.image || IMG.hero}
      imageAlt={sec.title || 'Lupe and Luxe new season fashion'}
    />
  );

  const renderSection = (sec) => {
    switch (sec.type) {
      case 'hero':
        return renderHero(sec);
      case 'banner':
      case 'announcement':
        return (
          <section key={sec._id} className="banner-section" style={sec.image ? { backgroundImage: `url(${sec.image})` } : {}}>
            <div className="container banner-content">
              {sec.title && <h2 className="banner-title">{sec.title}</h2>}
              {sec.text && <p className="banner-text">{sec.text}</p>}
              {sec.buttonText && sec.buttonLink && (
                <Link to={sec.buttonLink} className="btn btn-primary btn-lg">
                  {sec.buttonText}
                </Link>
              )}
            </div>
          </section>
        );
      case 'featured':
        return (
          <section key={sec._id} className="section featured-section">
            <div className="container">
              <Reveal className="section-head section-header">
                {sec.subtitle && <span className="eyebrow section-subtitle">{sec.subtitle}</span>}
                {sec.title && <h2 className="section-title">{sec.title}</h2>}
              </Reveal>
              <div className="products-grid">
                {featured.slice(0, 8).map((product, index) => (
                  <ProductCard key={product._id} product={product} index={index} />
                ))}
              </div>
            </div>
          </section>
        );
      case 'collection': {
        const cards = categories.slice(0, 8).map((category) => {
          const match = catalog.find((product) => product.category === category);
          return {
            title: category,
            text: 'Explore the current edit.',
            to: `/products?category=${encodeURIComponent(category)}`,
            image: match?.images?.[0] || IMG.tote,
            alt: `${category} collection`,
          };
        });
        if (cards.length === 0) return null;
        return (
          <section key={sec._id} className="section section-cream categories-section">
            <div className="container">
              <Reveal className="section-head section-header">
                {sec.subtitle && <span className="eyebrow section-subtitle">{sec.subtitle}</span>}
                {sec.title && <h2 className="section-title">{sec.title}</h2>}
                {sec.text && <p className="section-sub section-desc">{sec.text}</p>}
              </Reveal>
              <div className="collection-grid categories-grid">
                {cards.map((card) => (
                  <Link key={card.title} to={card.to} className="collection-card category-card">
                    <span className="collection-media category-media">
                      <img src={card.image} alt={card.alt} loading="lazy" />
                    </span>
                    <span className="collection-body category-body">
                      <span className="collection-name category-name">{card.title}</span>
                      <span className="collection-sub category-sub">{card.text}</span>
                      <span className="collection-cta">Shop now →</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      }
      case 'promo':
        return (
          <section key={sec._id} className="section ethos-section">
            <div className="container">
              <div className="promo-banner">
                <div className="promo-inner">
                  <div>
                    <span className="promo-chip">{sec.subtitle || 'Lupe & Luxe promise'}</span>
                    <h2 className="promo-title">{sec.title || 'More Style. More You.'}</h2>
                    <p className="promo-text">{sec.text || 'Premium fabrics, careful finishing and timeless silhouettes made for daily wear.'}</p>
                    {sec.buttonText && sec.buttonLink && (
                      <div className="section-actions" style={{ justifyContent: 'flex-start', marginTop: '1.4rem' }}>
                        <Link to={sec.buttonLink} className="btn btn-dark">
                          {sec.buttonText}
                        </Link>
                      </div>
                    )}
                  </div>
                  <div className="promo-side">
                    {(sec.items?.length ? sec.items : [
                      { title: 'Premium fabrics', text: 'Heavyweight cotton, fleece and canvas.' },
                      { title: 'Careful finishing', text: 'Embroidery, distressing and hardware.' },
                      { title: 'Easy returns', text: '7-day returns on eligible pieces.' },
                    ]).slice(0, 3).map((item, index) => (
                      <div key={index} className="testimonial-card" style={{ width: '100%' }}>
                        <strong>{item.title}</strong>
                        <span className="testimonial-author">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      case 'testimonial':
        return (
          <section key={sec._id} className="section">
            <div className="container">
              <Reveal className="section-head section-header">
                {sec.subtitle && <span className="eyebrow section-subtitle">{sec.subtitle}</span>}
                {sec.title && <h2 className="section-title">{sec.title}</h2>}
              </Reveal>
              <div className="testimonials-grid testimonials-grid">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review._id} className="testimonial-card">
                    <StarRating rating={review.rating} size={14} />
                    <p className="testimonial-text">“{review.text}”</p>
                    <p className="testimonial-author">— {review.name}{review.verified ? ' · Verified' : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      case 'newsletter':
        return (
          <section key={sec._id} className="section newsletter-section">
            <div className="container">
              <div className="newsletter-card">
                <p className="eyebrow">{sec.subtitle || 'Newsletter'}</p>
                <h2 className="newsletter-title">{sec.title || 'Be First to Know.'}</h2>
                <p className="newsletter-text">{sec.text || 'New arrivals, limited drops and private offers — straight to your inbox.'}</p>
                <NewsletterSignup contactEmail={contactEmail} source="homepage-cms" />
              </div>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  const hasCmsHero = sections.some((section) => section.type === 'hero');

  return (
    <div className="home-page">
      {!hasCmsHero && (
        <ShopHero
          eyebrow="New Season · 2026"
          titleLines={['Elevate Your', 'Everyday.']}
          text="Considered essentials, premium thrift finds and handcrafted details — designed to elevate the everyday."
          ctaText="Shop New Arrivals"
          ctaLink="/products?sort=latest"
          image={IMG.hero}
          imageAlt="Model wearing Lupe and Luxe new season outerwear"
        />
      )}
      {sections.map((section) => renderSection(section))}

      <section className="section latest-section" aria-label="New arrivals">
        <div className="container">
          <Reveal className="section-head section-header">
            <span className="eyebrow section-subtitle">Just landed</span>
            <h2 className="section-title">New Arrivals</h2>
            <p className="section-sub section-desc">Fresh pieces in compact, easy-to-shop edits.</p>
          </Reveal>
          <div className="products-grid">
            {latest.slice(0, 8).map((product, index) => (
              <ProductCard key={product._id} product={product} index={index} />
            ))}
          </div>
          <div className="section-actions section-action">
            <Link to="/products?sort=latest" className="btn btn-outline">
              View all new arrivals →
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-cream" aria-label="Shop by collection">
        <div className="container">
          <Reveal className="section-head section-header">
            <span className="eyebrow section-subtitle">Collections</span>
            <h2 className="section-title">Shop by Collection</h2>
            <p className="section-sub section-desc">Four focused edits for every wardrobe.</p>
          </Reveal>
          <div className="collection-grid">
            {COLLECTIONS.map((collection, index) => (
              <Reveal key={collection.title} delay={index * 0.06}>
                <Link to={collection.to} className="collection-card">
                  <span className="collection-media">
                    <img src={collection.image} alt={collection.alt} loading="lazy" />
                  </span>
                  <span className="collection-body">
                    <span className="collection-name">{collection.title}</span>
                    <span className="collection-sub">{collection.text}</span>
                    <span className="collection-cta">Shop now →</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-label="Jewels collection">
        <div className="container">
          <Reveal className="section-head section-header">
            <span className="eyebrow section-subtitle">Champagne details</span>
            <h2 className="section-title">Jewels</h2>
            <p className="section-sub section-desc">Charms and finishing touches from the current catalogue.</p>
          </Reveal>
          {jewelItems.length > 0 ? (
            <>
              <div className="products-grid">
                {jewelItems.map((product, index) => (
                  <ProductCard key={product._id} product={product} index={index} />
                ))}
              </div>
              <div className="section-actions section-action">
                <Link to="/products?audience=jewels" className="btn btn-outline">
                  Shop all jewels →
                </Link>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">✦</span>
              <h3>The jewel edit is being curated</h3>
              <p>Explore new arrivals from the live catalogue meanwhile.</p>
              <Link to="/products?sort=latest" className="btn btn-outline" style={{ marginTop: '1rem' }}>
                Shop new arrivals
              </Link>
            </div>
          )}
        </div>
      </section>

      {accessoryItems.length > 0 && (
        <section className="section section-tight" aria-label="Accessories">
          <div className="container">
            <Reveal className="section-head section-header">
              <span className="eyebrow section-subtitle">Carry everywhere</span>
              <h2 className="section-title">Accessories</h2>
            </Reveal>
            <div className="products-grid">
              {accessoryItems.map((product, index) => (
                <ProductCard key={product._id} product={product} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="sale" className="section" aria-label="Sale and promotions" style={{ scrollMarginTop: '90px' }}>
        <div className="container">
          <div className="promo-banner">
            <div className="promo-inner">
              <div>
                <span className="promo-chip">{saleItems.length > 0 ? `Sale · ${saleItems.length} pieces` : 'Limited-time edit'}</span>
                <h2 className="promo-title">More Style. More You.</h2>
                <p className="promo-text">
                  {saleItems.length > 0
                    ? 'Marked-down favourites from the live catalogue. When a size sells out, it is gone.'
                    : 'Watch this space for marked-down favourites. Shop the newest pieces meanwhile.'}
                </p>
                <div className="section-actions" style={{ justifyContent: 'flex-start', marginTop: '1.4rem' }}>
                  <Link to="/products?sort=latest" className="btn btn-dark">
                    Shop the edit
                  </Link>
                </div>
              </div>
              <div className="promo-side">
                {(saleItems.length > 0 ? saleItems.slice(0, 2) : bestSellers.slice(0, 2)).map((product) => (
                  <Link key={product._id} to={`/products/${product._id}`} className="testimonial-card" style={{ width: '100%' }}>
                    <strong>{product.name}</strong>
                    <span className="testimonial-author">
                      {hasSale(product)
                        ? `₹${product.salePrice.toFixed(0)} · was ₹${product.price.toFixed(0)}`
                        : `₹${product.price.toFixed(0)} · Bestseller`}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {saleItems.length > 0 && (
            <div className="products-grid" style={{ marginTop: '1.6rem' }}>
              {saleItems.map((product, index) => (
                <ProductCard key={product._id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section" aria-label="Customer reviews">
        <div className="container">
          <Reveal className="section-head section-header">
            <span className="eyebrow section-subtitle">Customer love</span>
            <h2 className="section-title">Worn & Loved</h2>
            {reviewStats.count > 0 && (
              <p className="section-sub section-desc" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Rated <StarRating rating={reviewStats.average} size={14} /> {reviewStats.average} by {reviewStats.count} verified customers
              </p>
            )}
          </Reveal>
          <div className="testimonials-grid">
            {reviews.length > 0 ? (
              reviews.map((review, index) => (
                <Reveal key={review._id || index} delay={Math.min(index * 0.06, 0.3)} className="testimonial-card">
                  <StarRating rating={review.rating} size={14} />
                  {review.title && <p className="testimonial-title">{review.title}</p>}
                  <p className="testimonial-text">“{review.text}”</p>
                  <p className="testimonial-author">— {review.name}{review.verified ? ' · Verified customer' : ''}</p>
                </Reveal>
              ))
            ) : (
              <div className="testimonial-card" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                <p className="testimonial-text">No reviews yet. Be the first to share your experience.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section review-section" aria-label="Write a review">
        <div className="container">
          <Reveal className="section-head section-header">
            <span className="eyebrow section-subtitle">Your voice</span>
            <h2 className="section-title">Write a Review</h2>
          </Reveal>
          <ReviewForm onSuccess={fetchReviews} />
        </div>
      </section>

      <section className="section social-section" aria-label="Social gallery">
        <div className="container">
          <Reveal className="section-head section-header">
            <span className="eyebrow section-subtitle">Community</span>
            <h2 className="section-title">@LUPEANDLUXE</h2>
            <p className="section-sub section-desc">Tag your fits to be featured in the community edit.</p>
          </Reveal>
          <div className="social-grid">
            {IMG.social.map((image, index) => (
              <a
                key={image}
                className="social-tile"
                href={instagramUrl || '/products'}
                target={instagramUrl ? '_blank' : undefined}
                rel={instagramUrl ? 'noopener noreferrer' : undefined}
                aria-label={`Lupe and Luxe look ${index + 1}`}
              >
                <img src={image} alt={`Lupe and Luxe community look ${index + 1}`} loading="lazy" />
              </a>
            ))}
          </div>
          <p className="social-handle">
            Follow <strong>@LUPEANDLUXE</strong> for drops, styling and behind-the-scenes.
          </p>
        </div>
      </section>

      <section className="section newsletter-section" aria-label="Newsletter">
        <div className="container">
          <div className="newsletter-card">
            <p className="eyebrow">Newsletter</p>
            <h2 className="newsletter-title">Be First to Know.</h2>
            <p className="newsletter-text">New arrivals, limited drops and private offers — straight to your inbox.</p>
            <NewsletterSignup contactEmail={contactEmail} source="homepage" />
            <p className="newsletter-note">One email per drop. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
