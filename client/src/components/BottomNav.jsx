import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const tabs = [
  {
    to: '/',
    label: 'Home',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#D4AF37' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 1 18 0"/><path d="M5 12a7 7 0 1 1 14 0"/><path d="M8 12a4 4 0 1 1 8 0"/><circle cx="12" cy="12" r="1.5" fill={active ? '#D4AF37' : 'none'}/>
      </svg>
    ),
  },
  {
    to: '/products',
    label: 'Shop',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
    ),
  },
  {
    to: '/cart',
    label: 'Cart',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    ),
    badge: 'cartCount',
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="5"/><path d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2"/></svg>
    ),
  },
];

export default function BottomNav() {
  const { user } = useAuth();
  const { cart } = useCart();
  const cartCount = cart?.reduce((s, i) => s + i.quantity, 0) || 0;

  const getBadge = (tab) => {
    if (tab.badge === 'cartCount' && cartCount > 0) return cartCount > 99 ? '99+' : cartCount;
    return null;
  };

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const badge = getBadge(tab);
        return (
          <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            {({ isActive }) => (
              <>
                <div className="bottom-nav-icon-wrap">
                  {tab.icon(isActive)}
                  {badge && <span className="bottom-nav-badge">{badge}</span>}
                </div>
                <span className="bottom-nav-label">{tab.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
