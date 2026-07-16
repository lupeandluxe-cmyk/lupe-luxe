import { useState, useEffect } from 'react';
import { internalFetch } from '../../hooks/useInternalAuth';

export default function InternalActivity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    internalFetch('/activity?limit=100').then(d => { setLogs(d || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="internal-loader"><div className="internal-spinner" /></div>;

  return (
    <div>
      <h2 className="internal-page-title">Activity Log</h2>
      <div className="internal-card">
        <div className="internal-table-wrap">
          <table className="internal-table">
            <thead><tr><th>Time</th><th>Employee</th><th>Action</th><th>Type</th><th>Details</th></tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l._id}>
                  <td>{new Date(l.createdAt).toLocaleString()}</td>
                  <td>{l.employee?.name || 'System'}</td>
                  <td>{l.action}</td>
                  <td><span className="internal-badge">{l.entityType}</span></td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.details || l.entityId}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-dark)' }}>No activity logged yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
