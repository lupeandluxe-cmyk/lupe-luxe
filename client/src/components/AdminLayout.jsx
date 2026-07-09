import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/products', label: 'Products', icon: '📦' },
  { path: '/admin/orders', label: 'Orders', icon: '📋' },
  { path: '/admin/customers', label: 'Customers', icon: '👥' },
  { path: '/admin/categories', label: 'Categories', icon: '🏷️' },
  { path: '/admin/coupons', label: 'Coupons', icon: '🎫' },
  { path: '/admin/homepage', label: 'Homepage Builder', icon: '🏠' },
  { path: '/admin/media', label: 'Media Library', icon: '🖼️' },
  { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  { path: '/admin/pages', label: 'Pages', icon: '📄' },
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
        </nav>
        <div className="sidebar-footer">
          <Link to="/" className="sidebar-link">← Back to Site</Link>
          <button onClick={handleLogout} className="sidebar-link logout-btn">🚪 Logout</button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <button className="admin-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span className="hamburger-line"></span>
          </button>
          <div className="admin-header-right">
            <span className="admin-user">👤 {user?.name}</span>
          </div>
        </header>
        <div className="admin-content">
          {children}
        </div>
      </div>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
