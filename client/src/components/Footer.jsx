import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-waves">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0 C300,60 600,-30 1200,20 L1200,120 L0,120 Z" className="wave wave1" />
          <path d="M0,40 C200,80 500,10 1200,50 L1200,120 L0,120 Z" className="wave wave2" />
        </svg>
      </div>
      <div className="footer-content">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3 className="footer-logo">☠ Lupe &amp; Luxe</h3>
            <p className="footer-tagline">
              Premium thrift &amp; custom clothing for those who sail the Grand Line.
              Every piece tells a story.
            </p>
          </div>
          <div className="footer-links">
            <h4>Navigate</h4>
            <Link to="/">Home</Link>
            <Link to="/products">Shop All</Link>
            <Link to="/products?category=Custom+Tees">Custom Tees</Link>
            <Link to="/products?category=Thrift+Vintage">Thrift Vintage</Link>
            <Link to="/products?category=Limited+Drops">Limited Drops</Link>
          </div>
          <div className="footer-links">
            <h4>Support</h4>
            <a href="#">Size Guide</a>
            <a href="#">Shipping &amp; Returns</a>
            <a href="#">Contact Us</a>
            <a href="#">FAQ</a>
          </div>
          <div className="footer-newsletter">
            <h4>Get in Touch</h4>
            <p>Reach out to us anytime!</p>
            <div className="footer-contact">
              <p className="contact-item">📧 lupeandluxe@gmail.com</p>
              <p className="contact-item">📞 +91 9654023351</p>
            </div>
            <div className="newsletter-form">
              <input type="email" placeholder="your@email.com" />
              <button className="btn-submit">Subscribe</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Lupe &amp; Luxe. All rights reserved.</p>
          <p className="footer-quote">"The one who inherits the will of all those who've sailed the seas..."</p>
        </div>
      </div>
    </footer>
  );
}
