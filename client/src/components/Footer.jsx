import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function Footer() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    api.get('/settings/public').then(res => setSettings(res.data)).catch(() => {});
  }, []);

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
            <h3 className="footer-logo">☠ {settings.siteName || 'Lupe & Luxe'}</h3>
            <p className="footer-tagline">{settings.siteDescription || 'Premium thrift & custom clothing for those who sail the Grand Line. Every piece tells a story.'}</p>
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
            <Link to="/page/shipping-policy">Shipping &amp; Returns</Link>
            <Link to="/page/contact">Contact Us</Link>
            <Link to="/page/faq">FAQ</Link>
            <Link to="/page/about">About Us</Link>
          </div>
          <div className="footer-newsletter">
            <h4>Get in Touch</h4>
            <p>Reach out to us anytime!</p>
            <div className="footer-contact">
              {settings.contactEmail && <p className="contact-item">📧 {settings.contactEmail}</p>}
              {settings.contactPhone && <p className="contact-item">📞 {settings.contactPhone}</p>}
              {settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="contact-item">📸 Instagram</a>}
              {settings.facebook && <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="contact-item">👍 Facebook</a>}
            </div>
            <div className="newsletter-form">
              <input type="email" placeholder="your@email.com" />
              <button className="btn-submit">Subscribe</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} {settings.siteName || 'Lupe & Luxe'}. All rights reserved.</p>
          <p className="footer-quote">"The one who inherits the will of all those who've sailed the seas..."</p>
        </div>
      </div>
    </footer>
  );
}
