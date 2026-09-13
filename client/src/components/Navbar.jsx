import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../api/axios';

const NAV_LINKS = [
  { to: '/products?sort=latest', label: 'New In', match: (search) => search.includes('sort=latest') },
  { to: '/products?audience=women', label: 'Women', match: (search) => search.includes('audience=women') },
  { to: '/products?audience=men', label: 'Men', match: (search) => search.includes('audience=men') },
  { to: '/products?audience=jewels', label: 'Jewels', match: (search) => search.includes('audience=jewels') },
  { to: '/#sale', label: 'Sale', sale: true, match: (_, hash) => hash === '#sale' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const totalItems = items.reduce((sum, i) => sum + (i.qty || 0), 0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
    setSearchOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    api
      .get('/settings/public')
      .then(({ data }) => {
        const active = data.announcementActive ?? data.announcementEnabled;
        const text = data.announcementText ?? data.announcement;
        if ((active === undefined || active === true || active === 'true') && text) {
          setAnnouncement(String(text));
        }
      })
      .catch(() => {});
  }, []);

  const submitSearch = (event) => {
    event?.preventDefault();
    if (!searchValue.trim()) return;
    navigate(`/products?keyword=${encodeURIComponent(searchValue.trim())}`);
  };

  return (
    <>
      {announcement && (
        <div className="announcement-bar" role="note">
          <span>{announcement}</span>
        </div>
      )}
      <header className={`site-header navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner nav-container">
          <button
            className="hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
          </button>

          <Link to="/" className="logo" aria-label="Lupe and Luxe home">
            <span className="logo-mark">☠</span>
            <span className="logo-text">
              Lupe <span className="logo-em">&amp;</span> Luxe
            </span>
          </Link>

          <nav className="nav-links nav-center" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`nav-link ${link.sale ? 'nav-link-sale' : ''} ${
                  link.match(location.search, location.hash) ? 'active' : ''
                }`.trim()}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="nav-actions nav-right">
            <div className="nav-search">
              <button
                className="icon-btn nav-icon-btn search-toggle"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label={searchOpen ? 'Close search' : 'Open search'}
                aria-expanded={searchOpen}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              </button>
              {searchOpen && (
                <form className="search-dropdown" onSubmit={submitSearch} role="search">
                  <label className="sr-only" htmlFor="site-search">
                    Search products
                  </label>
                  <input
                    id="site-search"
                    type="search"
                    placeholder="Search tees, hoodies, caps..."
                    autoFocus
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="search-input-nav"
                  />
                </form>
              )}
            </div>

            <Link to={user ? '/profile' : '/login'} className="icon-btn nav-icon-btn mobile-user-btn" aria-label="Account">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </Link>

            <Link to="/wishlist" className="icon-btn nav-icon-btn" aria-label={`Wishlist, ${wishlistCount} saved`}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 20.7C6.4 17.2 3 13.6 3 9.9 3 7.2 5.1 5 7.8 5c1.7 0 3.2.9 4.2 2.3C13 5.9 14.5 5 16.2 5 18.9 5 21 7.2 21 9.9c0 3.7-3.4 7.3-9 10.8z" /></svg>
              {wishlistCount > 0 && <span className="wishlist-count cart-badge">{wishlistCount > 99 ? '99+' : wishlistCount}</span>}
            </Link>

            <Link to="/cart" className="icon-btn nav-icon-btn cart-btn" aria-label={`Cart, ${totalItems} items`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
              {totalItems > 0 && <span className="cart-badge">{totalItems > 99 ? '99+' : totalItems}</span>}
            </Link>

            {user ? (
              <div
                className="user-dropdown-wrap"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button
                  className="icon-btn nav-icon-btn avatar-btn"
                  aria-label="Account menu"
                  aria-expanded={dropdownOpen}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </button>
                {dropdownOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <span className="dropdown-user-name">{user.name}</span>
                      <span className="dropdown-user-email">{user.email}</span>
                    </div>
                    <div className="dropdown-divider" />
                    <Link to="/profile" className="dropdown-item">Profile & Orders</Link>
                    <Link to="/wishlist" className="dropdown-item">Wishlist</Link>
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
      </header>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} role="dialog" aria-label="Menu">
        <div className="mobile-menu-header">
          <span className="mobile-menu-logo">
            <span className="logo-mark">☠</span>
            <span>Lupe &amp; Luxe</span>
          </span>
          <button className="icon-btn close-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>
        <div className="mobile-menu-body">
          <Link to="/products?sort=latest" className="mobile-link" onClick={() => setMenuOpen(false)}>New In</Link>
          <Link to="/products?audience=women" className="mobile-link" onClick={() => setMenuOpen(false)}>Women</Link>
          <Link to="/products?audience=men" className="mobile-link" onClick={() => setMenuOpen(false)}>Men</Link>
          <Link to="/products?audience=jewels" className="mobile-link" onClick={() => setMenuOpen(false)}>Jewels</Link>
          <Link to="/#sale" className="mobile-link" onClick={() => setMenuOpen(false)}>Sale</Link>
          <Link to="/wishlist" className="mobile-link" onClick={() => setMenuOpen(false)}>Wishlist {wishlistCount > 0 && `(${wishlistCount})`}</Link>
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
