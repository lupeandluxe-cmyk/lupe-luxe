import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers' + (search ? `?search=${search}` : ''));
      setCustomers(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleBlock = async (id, blocked) => {
    await api.put(`/customers/${id}`, { blocked: !blocked });
    fetchCustomers();
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await api.delete(`/customers/${id}`);
    fetchCustomers();
  };

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-page-content">
      <div className="page-header">
        <h1 className="admin-page-title">Customers ({customers.length})</h1>
        <input className="search-input" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchCustomers()} />
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Admin</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            {customers.map(u => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.isAdmin ? 'Yes' : 'No'}</td>
                <td><span className={`badge ${u.blocked ? 'inactive' : 'active'}`}>{u.blocked ? 'Blocked' : 'Active'}</span></td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="action-cell">
                  <button onClick={() => toggleBlock(u._id, u.blocked)} className="btn-sm">{u.blocked ? 'Unblock' : 'Block'}</button>
                  {!u.isAdmin && <button onClick={() => deleteUser(u._id)} className="btn-sm danger">🗑️</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
