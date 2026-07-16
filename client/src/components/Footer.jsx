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
      <div className="footer-inner container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3 className="footer-brand-name">✦ {settings.siteName || 'Lupe & Luxe'}</h3>
            <p className="footer-tagline">{settings.siteDescription || 'Premium thrift & custom clothing for those who sail the Grand Line.'}</p>
            <div className="footer-social">
              {settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Instagram">📸</a>}
              {settings.facebook && <a href={settings.facebook} target="_blank" rel="noopener noreferrer" class="footer-social-link" aria-label="Facebook">👍</a>}
            </div>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Navigate</h4>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/products">Shop All</Link>
              <Link to="/products?category=Custom+Tees">Custom Tees</Link>
              <Link to="/products?category=Thrift+Vintage">Thrift Vintage</Link>
              <Link to="/products?category=Limited+Drops">Limited Drops</Link>
            </div>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Support</h4>
            <div className="footer-links">
              <Link to="/page/shipping-policy">Shipping & Returns</Link>
              <Link to="/page/contact">Contact Us</Link>
              <Link to="/page/faq">FAQ</Link>
              <Link to="/page/about">About Us</Link>
            </div>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Get in Touch</h4>
            <div>
              {settings.contactEmail && <a href={`mailto:${settings.contactEmail}`} className="footer-contact-link">{settings.contactEmail}</a>}
              {settings.contactPhone && <span className="footer-contact-link">{settings.contactPhone}</span>}
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
