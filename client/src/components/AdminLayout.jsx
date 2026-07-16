import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { internalFetch } from '../hooks/useInternalAuth';
import { io } from 'socket.io-client';
const API_URL = import.meta.env.VITE_API_URL || '/api';
const SOCKET_URL = API_URL.startsWith('http') ? API_URL.replace('/api', '') : window.location.origin;

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
  { path: '/admin/admins', label: 'Admin Management', icon: '🛡️' },
];

const internalSubItems = [
  { path: '/admin/internal/dashboard', label: 'Dashboard', icon: '📊', permission: null },
  { path: '/admin/internal/orders', label: 'Live Orders', icon: '📦', permission: 'orders:view' },
  { path: '/admin/internal/notifications', label: 'Notifications', icon: '🔔', permission: null },
  { path: '/admin/internal/chat', label: 'Employee Chat', icon: '💬', permission: 'messages:view' },
  { path: '/admin/internal/tasks', label: 'Tasks', icon: '✅', permission: 'tasks:view' },
  { path: '/admin/internal/departments', label: 'Departments', icon: '🏢', permission: 'departments:view' },
  { path: '/admin/internal/employees', label: 'Employees', icon: '👥', permission: 'employees:view' },
  { path: '/admin/internal/activity', label: 'Activity Log', icon: '📋', permission: 'activity:view' },
  { path: '/admin/internal/reports', label: 'Reports', icon: '📈', permission: 'reports:view' },
  { path: '/admin/internal/settings', label: 'Settings', icon: '⚙️', permission: null },
];

function hasPermission(employee, required) {
  if (!required) return true;
  if (!employee?.role) return false;
  if (employee.role.name === 'CEO') return true;
  const allowed = employee.allowedPermissions || [];
  const rolePerms = employee.role.permissions || [];
  const [mod, act] = required.split(':');
  const matchRole = rolePerms.some(p => p.module === mod && (p.actions.includes('*') || p.actions.includes(act)));
  const matchEmp = allowed.includes(required) || allowed.includes(`${mod}:*`);
  return matchRole || matchEmp;
}

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [orderAlert, setOrderAlert] = useState(false);
  const socketRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout: adminLogout } = useAuth();

  const isInternalRoute = location.pathname.startsWith('/admin/internal');
  const isEmployeeMode = !user?.isAdmin && !!localStorage.getItem('internal_token');
  const displayName = isEmployeeMode ? employee?.name : user?.name;
  const displayRole = isEmployeeMode ? employee?.role?.name : 'Admin';

  useEffect(() => {
    if (!isEmployeeMode) return;
    let cancelled = false;
    internalFetch('/auth/profile').then(data => {
      if (!cancelled && data.employee) setEmployee({ ...data.employee, role: data.role });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isEmployeeMode]);

  useEffect(() => {
    if (!isInternalRoute) return;
    let cancelled = false;
    const fetchNotifs = async () => {
      try {
        const res = await internalFetch('/notifications?unread=true&limit=1');
        if (!cancelled && res && typeof res.unread === 'number') setUnreadNotifs(res.unread);
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isInternalRoute]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('room:join', 'admin');
    });

    socket.on('new_order', () => {
      setOrderAlert(true);
      setTimeout(() => setOrderAlert(false), 8000);
    });

    socket.on('order_status_change', () => {
      setOrderAlert(true);
      setTimeout(() => setOrderAlert(false), 8000);
    });

    return () => { socket.disconnect(); };
  }, []);

  const handleLogout = async () => {
    if (isEmployeeMode) {
      await internalFetch('/auth/logout', { method: 'POST' }).catch(() => {});
      localStorage.removeItem('internal_token');
      localStorage.removeItem('internal_refresh');
      localStorage.removeItem('internal_employee');
      navigate('/internal/login');
    } else {
      adminLogout();
      navigate('/');
    }
  };

  const isActive = (path) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path === '/admin') return false;
    return location.pathname.startsWith(path);
  };

  const isInternalActive = () => location.pathname.startsWith('/admin/internal');

  const filteredSubItems = useMemo(() => {
    if (!employee?.role) return internalSubItems.filter(i => !i.permission);
    return internalSubItems.filter(i => hasPermission(employee, i.permission));
  }, [employee]);

  const handlePortalToggle = () => {
    if (!portalOpen && location.pathname.startsWith('/admin/internal')) {
      setPortalOpen(true);
    }
    setPortalOpen(!portalOpen);
  };

  useEffect(() => {
    if (location.pathname.startsWith('/admin/internal')) {
      setPortalOpen(true);
    }
  }, [location.pathname]);

  return (
    <div className="admin-layout">
      <button className="admin-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle admin menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></svg>
      </button>

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to={isEmployeeMode ? '/admin/internal/dashboard' : '/admin'} className="sidebar-logo">
            <span className="logo-mark">☠</span>
            <span>Lupe &amp; Luxe</span>
          </Link>
          {isEmployeeMode && <span className="internal-portal-badge">Internal Portal</span>}
        </div>

        <nav className="sidebar-nav">
          {!isEmployeeMode && (
            <>
              {menuItems.map(item => (
                <Link key={item.path} to={item.path}
                  className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}>
                  <span className="sidebar-icon">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <div className="sidebar-divider" />
              <button className={`sidebar-link submenu-toggle ${isInternalActive() ? 'active' : ''} ${portalOpen ? 'expanded' : ''}`}
                onClick={handlePortalToggle}>
                <span className="sidebar-icon">🔐</span>
                <span>Internal Portal</span>
                <span className="submenu-arrow">{portalOpen ? '▼' : '▶'}</span>
              </button>
              {portalOpen && (
                <div className="submenu-items">
                  {filteredSubItems.map(item => (
                    <Link key={item.path} to={item.path}
                      className={`sidebar-link submenu-link ${location.pathname === item.path ? 'active' : ''}`}
                      onClick={() => setSidebarOpen(false)}>
                      <span className="sidebar-icon">{item.icon}</span>
                      <span>{item.label}</span>
                      {item.path === '/admin/internal/notifications' && unreadNotifs > 0 && (
                        <span className="sidebar-badge">{unreadNotifs > 99 ? '99+' : unreadNotifs}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {isEmployeeMode && (
            <>
              {filteredSubItems.map(item => (
                <Link key={item.path} to={item.path}
                  className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}>
                  <span className="sidebar-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.path === '/admin/internal/notifications' && unreadNotifs > 0 && (
                    <span className="sidebar-badge">{unreadNotifs > 99 ? '99+' : unreadNotifs}</span>
                  )}
                </Link>
              ))}
            </>
          )}

          <Link to="/" className="sidebar-link" onClick={() => setSidebarOpen(false)} style={{ marginTop: '0.5rem' }}>← Back to Site</Link>
          <button onClick={handleLogout} className="sidebar-link logout-btn" style={{ color: '#c0392b', cursor: 'pointer', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '0.7rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            🚪 Logout
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{displayName?.[0] || '?'}</div>
            <div>
              <p className="sidebar-user-name">{displayName || 'User'}</p>
              <p className="sidebar-user-role">{displayRole}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <h1 className="admin-title">{isEmployeeMode ? 'Internal Portal' : 'Admin Panel'}</h1>
          <div className="admin-header-right">
            <span style={{ position: 'relative', marginRight: '0.75rem', cursor: 'pointer' }} title="Order notifications">
              🔔
              {orderAlert && <span style={{
                position: 'absolute', top: '-4px', right: '-6px', width: '10px', height: '10px',
                borderRadius: '50%', background: '#e74c3c', animation: 'pulse 1s infinite'
              }} />}
            </span>
            <span className="admin-user">👤 {displayName}</span>
          </div>
        </header>
        <div className="admin-content">
          {children}
        </div>
      </div>

      {sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}
