import { useState, useEffect } from 'react';
import { internalFetch } from '../../hooks/useInternalAuth';

export default function InternalDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    internalFetch('/departments').then(d => { setDepartments(d || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="internal-loader"><div className="internal-spinner" /></div>;

  return (
    <div>
      <h2 className="internal-page-title">Departments</h2>
      <div className="internal-stats-grid" style={{ marginTop: '1rem' }}>
        {departments.map(d => (
          <div key={d._id} className="internal-stat-card" style={{ borderLeftColor: '#3498db' }}>
            <span className="internal-stat-icon">🏢</span>
            <div>
              <p className="internal-stat-value">{d.name}</p>
              <p className="internal-stat-label">{d.description || 'No description'}</p>
            </div>
          </div>
        ))}
        {departments.length === 0 && (
          <div className="internal-stat-card">
            <p style={{ color: 'var(--gray-dark)' }}>No departments created yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
