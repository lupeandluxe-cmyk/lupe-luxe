import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  return (
    <>
      <div className="top-bar">
        <span className="top-bar-text">✦ Free shipping on orders over ₹3,999 ✦</span>
      </div>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
          </button>

          <Link to="/" className="logo">
            <span className="logo-icon">☠</span>
            <span className="logo-text">
              Lupe <span className="logo-amp">&amp;</span> Luxe
            </span>
          </Link>

          <div className={`nav-links ${menuOpen ? 'mobile-open' : ''}`}>
            <Link to="/" className="nav-link" data-text="Home">Home</Link>
            <Link to="/products" className="nav-link" data-text="Shop">Shop</Link>
            <Link to="/cart" className="nav-link cart-link">
              <span className="nav-icon">🛒</span>
              {items.length > 0 && <span className="cart-count">{items.length}</span>}
            </Link>
            {user ? (
              <div className="nav-dropdown">
                <span className="nav-link user-trigger">
                  <span className="nav-icon">👤</span>
                  <span className="user-name">{user.name.split(' ')[0]}</span>
                </span>
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item">Profile</Link>
                  {user.isAdmin && <Link to="/admin" className="dropdown-item">Admin Panel</Link>}
                  <button onClick={logout} className="dropdown-item danger">Logout</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="nav-link">
                <span className="nav-icon">⚓</span> Sign In
              </Link>
            )}
          </div>
        </div>
        {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}
      </nav>
    </>
  );
}
