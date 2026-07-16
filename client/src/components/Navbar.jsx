import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState('');
  const location = useLocation();
  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setDropdownOpen(false); }, [location]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleSearchKey = (e) => {
    if (e.key === 'Enter' && searchOpen.trim()) {
      window.location.href = `/products?keyword=${encodeURIComponent(searchOpen.trim())}`;
    }
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>
          </button>

          <Link to="/" className="nav-logo">
            <span className="nav-logo-icon">✦</span>
            <span className="nav-logo-text">
              Lupe <span className="nav-logo-amp">&amp;</span> Luxe
            </span>
          </Link>

          <div className="nav-links">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              <span className="nav-link-dot" /> Home
            </Link>
            <Link to="/products" className={`nav-link ${location.pathname === '/products' ? 'active' : ''}`}>
              <span className="nav-link-dot" /> Shop
            </Link>
          </div>

          <div className="nav-actions">
            <div className="nav-search-wrap">
              <button className="nav-icon-btn" onClick={() => setSearchOpen(searchOpen ? '' : ' ')} aria-label="Search">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </button>
              {searchOpen && (
                <div className="nav-search-drop">
                  <input
                    type="text"
                    placeholder="Search products..."
                    autoFocus
                    value={searchOpen === ' ' ? '' : searchOpen}
                    onChange={(e) => setSearchOpen(e.target.value)}
                    onKeyDown={handleSearchKey}
                    className="nav-search-input"
                  />
                </div>
              )}
            </div>

            <Link to="/cart" className="nav-icon-btn nav-cart-btn" aria-label="Cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              {totalItems > 0 && <span className="nav-cart-badge">{totalItems > 99 ? '99+' : totalItems}</span>}
            </Link>

            <Link to={user ? '/profile' : '/login'} className="nav-icon-btn nav-mobile-user" aria-label="Account">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </Link>

            {user ? (
              <div className="nav-user-drop-wrap" onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
                <button className="nav-icon-btn nav-avatar-btn" aria-label="Account">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </button>
                {dropdownOpen && (
                  <div className="nav-user-drop">
                    <div className="nav-drop-head">
                      <span className="nav-drop-name">{user.name}</span>
                      <span className="nav-drop-email">{user.email}</span>
                    </div>
                    <div className="nav-drop-divider" />
                    <Link to="/profile" className="nav-drop-item">Profile & Orders</Link>
                    {user.isAdmin && <Link to="/admin" className="nav-drop-item">Admin Panel</Link>}
                    <div className="nav-drop-divider" />
                    <button onClick={logout} className="nav-drop-item nav-drop-danger">Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-sm btn-nav">Sign In</Link>
            )}
          </div>
        </div>
        <span className="nav-doodle nav-doodle-1">✧</span>
        <span className="nav-doodle nav-doodle-2">✦</span>
        <span className="nav-doodle nav-doodle-3">♥</span>
      </nav>

      <div className={`nav-mobile ${menuOpen ? 'open' : ''}`}>
        <div className="nav-mobile-head">
          <span className="nav-mobile-logo">✦ Lupe &amp; Luxe</span>
          <button className="nav-icon-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="nav-mobile-body">
          <Link to="/" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/products" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Shop All</Link>
          <Link to="/cart" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Cart {totalItems > 0 && `(${totalItems})`}</Link>
          {user ? (
            <>
              <Link to="/profile" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Profile & Orders</Link>
              {user.isAdmin && <Link to="/admin" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Admin Panel</Link>}
              <button onClick={() => { logout(); setMenuOpen(false); }} className="nav-mobile-link nav-mobile-danger">Sign Out</button>
            </>
          ) : (
            <Link to="/login" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Sign In</Link>
          )}
        </div>
        <span className="nav-mobile-doodle nav-mobile-doodle-1">✧</span>
        <span className="nav-mobile-doodle nav-mobile-doodle-2">✦</span>
        <span className="nav-mobile-doodle nav-mobile-doodle-3">♥</span>
      </div>

      {menuOpen && <div className="nav-mobile-overlay" onClick={() => setMenuOpen(false)} />}
    </>
  );
}
