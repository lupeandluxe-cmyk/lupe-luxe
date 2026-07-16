import { useState, useEffect } from 'react';
import { internalFetch } from '../../hooks/useInternalAuth';

export default function InternalEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    internalFetch('/employees').then(d => { setEmployees(d || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="internal-loader"><div className="internal-spinner" /></div>;

  return (
    <div>
      <h2 className="internal-page-title">Employees</h2>
      <div className="internal-card">
        <div className="internal-table-wrap">
          <table className="internal-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Online</th></tr></thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp._id}>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td><span className="internal-badge">{emp.role?.name || 'N/A'}</span></td>
                  <td>{emp.department?.name || 'N/A'}</td>
                  <td><span className={`internal-online-dot ${emp.isOnline ? 'online' : ''}`} /> {emp.isOnline ? 'Online' : 'Offline'}</td>
                </tr>
              ))}
              {employees.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-dark)' }}>No employees found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
