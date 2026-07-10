import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/payment-settings', label: 'Payment Settings', icon: '💳' },
  { path: '/admin/products', label: 'Products', icon: '📦' },
  { path: '/admin/orders', label: 'Orders', icon: '📋' },
  { path: '/admin/customers', label: 'Customers', icon: '👥' },
  { path: '/admin/categories', label: 'Categories', icon: '🏷️' },
  { path: '/admin/coupons', label: 'Coupons', icon: '🎫' },
  { path: '/admin/homepage', label: 'Homepage Builder', icon: '🏠' },
  { path: '/admin/media', label: 'Media Library', icon: '🖼️' },
  { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  { path: '/admin/pages', label: 'Pages', icon: '📄' },
  { path: '/admin/live-chat', label: 'Live Chat', icon: '💬' },
  { path: '/admin/reports', label: 'Reports', icon: '📈' },
];

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="admin-layout">
      <button className="admin-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle admin menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></svg>
      </button>

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/admin" className="sidebar-logo">☠ Lupe & Luxe</Link>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <Link to="/" className="sidebar-link" onClick={() => setSidebarOpen(false)}>← Back to Site</Link>
          <button onClick={handleLogout} className="sidebar-link logout-btn" style={{ color: '#c0392b', cursor: 'pointer', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '0.7rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>🚪 Logout</button>
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <h1 className="admin-title">Admin Panel</h1>
          <div className="admin-header-right">
            <span className="admin-user">👤 {user?.name}</span>
          </div>
        </header>
        <div className="admin-content">
          {children}
        </div>
      </div>

      {sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />}
    </div>
  );
}
