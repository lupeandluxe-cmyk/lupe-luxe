import { useState, useEffect } from 'react';
import { internalFetch } from '../../hooks/useInternalAuth';

export default function InternalNotifications() {
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    internalFetch(`/notifications?page=${page}&limit=20`).then(d => {
      setNotifs(d.notifications || []);
      setUnread(d.unread || 0);
      setTotalPages(d.pages || 1);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const markRead = async (id) => {
    await internalFetch(`/notifications/${id}/read`, { method: 'PUT' });
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await internalFetch('/notifications/read-all', { method: 'PUT' });
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  if (loading && notifs.length === 0) return <div className="internal-loader"><div className="internal-spinner" /></div>;

  return (
    <div>
      <div className="internal-page-header">
        <h2 className="internal-page-title">Notifications</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {unread > 0 && <span className="internal-stat-value" style={{ fontSize: '0.85rem' }}>{unread} unread</span>}
          {unread > 0 && <button className="internal-btn primary sm" onClick={markAllRead}>Mark All Read</button>}
        </div>
      </div>
      <div className="internal-card">
        {notifs.map(n => (
          <div key={n._id} className={`internal-task-row ${!n.read ? 'unread' : ''}`} style={{ cursor: n.read ? 'default' : 'pointer' }}
            onClick={() => !n.read && markRead(n._id)}>
            <span style={{ fontSize: '1.1rem', opacity: n.read ? 0.4 : 1 }}>{n.read ? '🔔' : '🔴'}</span>
            <div style={{ flex: 1 }}>
              <p className="internal-task-title">{n.title}</p>
              <p className="internal-task-meta">{n.message} · {new Date(n.createdAt).toLocaleString()}</p>
            </div>
            {!n.read && <span className="internal-badge pending">New</span>}
          </div>
        ))}
        {notifs.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-dark)' }}>No notifications</p>}
        {totalPages > 1 && (
          <div className="internal-pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="internal-btn sm">← Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="internal-btn sm">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
