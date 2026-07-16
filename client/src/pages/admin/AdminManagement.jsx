import { useState, useEffect } from 'react';
import api from '../../api/axios';

const emptyForm = { name: '', email: '', password: '' };

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [resetId, setResetId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editName, setEditName] = useState('');
  const [resetPw, setResetPw] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/auth/admins');
      setAdmins(res.data);
    } catch { showMsg('Failed to load admins', 'error'); }
    finally { setLoading(false); }
  };

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/admins', form);
      showMsg('Admin created');
      setShowAdd(false);
      setForm(emptyForm);
      fetchAdmins();
    } catch (err) { showMsg(err.response?.data?.message || 'Failed to create admin', 'error'); }
  };

  const handleEdit = async (id) => {
    if (!editName.trim()) return showMsg('Name is required', 'error');
    try {
      await api.put(`/auth/admins/${id}`, { name: editName });
      showMsg('Admin updated');
      setEditId(null);
      fetchAdmins();
    } catch (err) { showMsg(err.response?.data?.message || 'Failed to update admin', 'error'); }
  };

  const handleToggleBlock = async (admin) => {
    try {
      await api.put(`/auth/admins/${admin._id}`, { blocked: !admin.blocked });
      showMsg(admin.blocked ? 'Admin unblocked' : 'Admin blocked');
      fetchAdmins();
    } catch (err) { showMsg(err.response?.data?.message || 'Failed to update admin', 'error'); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetPw.length < 8) return showMsg('Password must be at least 8 characters', 'error');
    try {
      await api.put(`/auth/admins/${resetId}/reset-password`, { password: resetPw });
      showMsg('Password reset');
      setResetId(null);
      setResetPw('');
    } catch (err) { showMsg(err.response?.data?.message || 'Failed to reset password', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) return;
    try {
      await api.delete(`/auth/admins/${id}`);
      showMsg('Admin removed');
      fetchAdmins();
    } catch (err) { showMsg(err.response?.data?.message || 'Failed to delete admin', 'error'); }
  };

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-page-content">
      <div className="page-header">
        <h1 className="admin-page-title">Admin Management ({admins.length})</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Admin</button>
      </div>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(a => (
              <tr key={a._id}>
                <td>
                  {editId === a._id ? (
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="edit-input" onKeyDown={e => e.key === 'Enter' && handleEdit(a._id)} />
                  ) : a.name}
                </td>
                <td>{a.email}</td>
                <td><span className={`badge ${a.blocked ? 'inactive' : 'active'}`}>{a.blocked ? 'Suspended' : 'Active'}</span></td>
                <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                <td className="action-cell" style={{ gap: '0.35rem' }}>
                  {editId === a._id ? (
                    <>
                      <button onClick={() => handleEdit(a._id)} className="btn-sm">Save</button>
                      <button onClick={() => setEditId(null)} className="btn-sm">Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => { setEditId(a._id); setEditName(a.name); }} className="btn-sm">Edit</button>
                  )}
                  <button onClick={() => handleToggleBlock(a)} className="btn-sm">
                    {a.blocked ? 'Unblock' : 'Suspend'}
                  </button>
                  <button onClick={() => setResetId(a._id)} className="btn-sm">Reset Password</button>
                  <button onClick={() => handleDelete(a._id)} className="btn-sm danger">Delete</button>
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No admin accounts found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Admin</h2>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Create Admin</button>
                <button type="button" className="btn" onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetId && (
        <div className="modal-overlay" onClick={() => { setResetId(null); setResetPw(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Reset Password</h2>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>New Password (min 8 characters)</label>
                <input type="password" value={resetPw} onChange={e => setResetPw(e.target.value)} required minLength={8} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Reset</button>
                <button type="button" className="btn" onClick={() => { setResetId(null); setResetPw(''); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
