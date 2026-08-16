import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function Footer() {
  const [settings, setSettings] = useState({});
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/settings/public').then(res => setSettings(res.data)).catch(() => {});
    api.get('/products/categories').then(res => setCategories(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  }, []);

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3 className="footer-logo">{settings.siteName || 'Lupe & Luxe'}</h3>
              <p className="footer-tagline">{settings.siteDescription || 'Premium thrift & custom clothing for those who sail the Grand Line.'}</p>
              <div className="footer-social">
                {settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">📸</a>}
                {settings.facebook && <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">👍</a>}
              </div>
            </div>
            <div className="footer-links">
              <h4>Shop</h4>
              <Link to="/products">Shop All</Link>
              {categories.slice(0, 4).map(cat => (
                <Link key={cat} to={`/products?category=${encodeURIComponent(cat)}`}>{cat}</Link>
              ))}
            </div>
            <div className="footer-links">
              <h4>Info</h4>
              <Link to="/page/about">About Us</Link>
              <Link to="/page/shipping-policy">Shipping & Returns</Link>
              <Link to="/page/faq">FAQ</Link>
              <Link to="/page/contact">Contact</Link>
            </div>
            <div className="footer-links">
              <h4>Contact</h4>
              {settings.contactEmail && <a href={`mailto:${settings.contactEmail}`} className="contact-link">{settings.contactEmail}</a>}
              {settings.contactPhone && <span className="contact-link">{settings.contactPhone}</span>}
              {!settings.contactEmail && <span className="contact-link">support@lupeandluxe.com</span>}
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} {settings.siteName || 'Lupe & Luxe'}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}