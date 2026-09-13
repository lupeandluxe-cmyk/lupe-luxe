import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const SHOP_LINKS = [
  { label: 'New Arrivals', to: '/products?sort=latest' },
  { label: 'Boys', to: '/products?audience=boys' },
  { label: 'Girls', to: '/products?audience=girls' },
  { label: 'Women', to: '/products?audience=women' },
  { label: 'Men', to: '/products?audience=men' },
  { label: 'Jewels', to: '/products?audience=jewels' },
  { label: 'Accessories', to: '/products?audience=accessories' },
  { label: 'Sale', to: '/#sale' },
];

const HELP_LINKS = [
  { label: 'Contact', to: '/page/contact' },
  { label: 'Shipping', to: '/page/shipping-policy' },
  { label: 'Returns', to: '/page/returns' },
  { label: 'Track Order', to: '/profile' },
  { label: 'FAQ', to: '/page/faq' },
];

const ABOUT_LINKS = [
  { label: 'Our Story', to: '/page/about' },
  { label: 'Privacy Policy', to: '/page/privacy' },
  { label: 'Terms', to: '/page/terms' },
];

export default function Footer() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    api
      .get('/settings/public')
      .then((res) => setSettings(res.data || {}))
      .catch(() => {});
  }, []);

  const socials = [
    { label: 'IG', name: 'Instagram', url: settings.instagramUrl || settings.instagram },
    { label: 'FB', name: 'Facebook', url: settings.facebookUrl || settings.facebook },
    { label: 'X', name: 'X', url: settings.twitterUrl || settings.twitter },
    { label: 'YT', name: 'YouTube', url: settings.youtubeUrl || settings.youtube },
  ].filter((social) => social.url);

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3 className="footer-logo">☠ {settings.siteName || 'Lupe & Luxe'}</h3>
              <p className="footer-tagline">
                {settings.siteDescription || 'Premium everyday fashion, thoughtful thrift finds and handcrafted details.'}
              </p>
              {socials.length > 0 && (
                <div className="footer-social">
                  {socials.map((social) => (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      aria-label={social.name}
                    >
                      {social.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <nav className="footer-links" aria-label="Shop">
              <h4>Shop</h4>
              {SHOP_LINKS.map((link) => (
                <Link key={link.label} to={link.to}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <nav className="footer-links" aria-label="Help">
              <h4>Help</h4>
              {HELP_LINKS.map((link) => (
                <Link key={link.label} to={link.to}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="footer-links" aria-label="About">
              <h4>About</h4>
              {ABOUT_LINKS.map((link) => (
                <Link key={link.label} to={link.to}>
                  {link.label}
                </Link>
              ))}
              {settings.contactEmail && (
                <a href={`mailto:${settings.contactEmail}`} className="contact-link">
                  {settings.contactEmail}
                </a>
              )}
              {settings.contactPhone && <span className="contact-link">{settings.contactPhone}</span>}
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} {settings.siteName || 'Lupe & Luxe'}. All rights reserved.</p>
            <p className="footer-quote">Elevate your everyday.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
