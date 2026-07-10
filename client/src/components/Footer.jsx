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
      <div className="footer-content">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <img src="/logo.jpeg" alt="Lupe & Luxe" className="footer-logo-img" />
              <p className="footer-tagline">{settings.siteDescription || 'Premium thrift & custom clothing for those who sail the Grand Line.'}</p>
              <div className="footer-social">
                {settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">📸</a>}
                {settings.facebook && <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">👍</a>}
              </div>
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
              <Link to="/page/shipping-policy">Shipping & Returns</Link>
              <Link to="/page/contact">Contact Us</Link>
              <Link to="/page/faq">FAQ</Link>
              <Link to="/page/about">About Us</Link>
            </div>
            <div className="footer-newsletter">
              <h4>Get in Touch</h4>
              {settings.contactEmail && <a href={`mailto:${settings.contactEmail}`} className="contact-link">{settings.contactEmail}</a>}
              {settings.contactPhone && <span className="contact-link">{settings.contactPhone}</span>}
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} {settings.siteName || 'Lupe & Luxe'}. All rights reserved.</p>
            <p className="footer-quote">"The one who inherits the will of all those who've sailed the seas..."</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
