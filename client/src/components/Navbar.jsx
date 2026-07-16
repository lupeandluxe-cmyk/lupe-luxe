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
        <div className="nav-container">
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
          </button>

          <Link to="/" className="logo">
            <span className="logo-mark">☠</span>
            <span className="logo-text">
              Lupe <span className="logo-em">&amp;</span> Luxe
            </span>
          </Link>

          <div className="nav-center">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
            <Link to="/products" className={`nav-link ${location.pathname === '/products' ? 'active' : ''}`}>Shop</Link>
          </div>

          <div className="nav-right">
            <div className="nav-search">
              <button className="icon-btn search-toggle" onClick={() => setSearchOpen(searchOpen ? '' : ' ')} aria-label="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </button>
              {searchOpen && (
                <div className="search-dropdown">
                  <input
                    type="text"
                    placeholder="Search products..."
                    autoFocus
                    value={searchOpen === ' ' ? '' : searchOpen}
                    onChange={(e) => setSearchOpen(e.target.value)}
                    onKeyDown={handleSearchKey}
                    className="search-input-nav"
                  />
                </div>
              )}
            </div>

            <Link to="/cart" className="icon-btn cart-btn" aria-label="Cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              {totalItems > 0 && <span className="cart-badge">{totalItems > 99 ? '99+' : totalItems}</span>}
            </Link>

            <Link to={user ? '/profile' : '/login'} className="icon-btn mobile-user-btn" aria-label="Account">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </Link>

            {user ? (
              <div className="user-dropdown-wrap" onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
                <button className="icon-btn avatar-btn" aria-label="Account">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </button>
                {dropdownOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <span className="dropdown-user-name">{user.name}</span>
                      <span className="dropdown-user-email">{user.email}</span>
                    </div>
                    <div className="dropdown-divider" />
                    <Link to="/profile" className="dropdown-item">Profile & Orders</Link>
                    {user.isAdmin && <Link to="/admin" className="dropdown-item">Admin Panel</Link>}
                    <div className="dropdown-divider" />
                    <button onClick={logout} className="dropdown-item dropdown-danger">Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-nav-cta">Sign In</Link>
            )}
          </div>
        </div>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <span className="mobile-menu-logo">
            <span className="logo-mark">☠</span>
            <span>Lupe &amp; Luxe</span>
          </span>
          <button className="icon-btn close-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="mobile-menu-body">
          <Link to="/" className="mobile-link" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/products" className="mobile-link" onClick={() => setMenuOpen(false)}>Shop All</Link>
          <Link to="/cart" className="mobile-link" onClick={() => setMenuOpen(false)}>Cart {totalItems > 0 && `(${totalItems})`}</Link>
          {user ? (
            <>
              <Link to="/profile" className="mobile-link" onClick={() => setMenuOpen(false)}>Profile & Orders</Link>
              {user.isAdmin && <Link to="/admin" className="mobile-link" onClick={() => setMenuOpen(false)}>Admin Panel</Link>}
              <button onClick={() => { logout(); setMenuOpen(false); }} className="mobile-link mobile-link-danger">Sign Out</button>
            </>
          ) : (
            <Link to="/login" className="mobile-link" onClick={() => setMenuOpen(false)}>Sign In</Link>
          )}
        </div>
      </div>

      {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}
    </>
  );
}
