import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminPages() {
  const [pages, setPages] = useState([]);
  const [form, setForm] = useState({ title: '', content: '', slug: '', metaTitle: '', metaDescription: '' });
  const [editing, setEditing] = useState(null);

  useEffect(() => { fetchPages(); }, []);

  const fetchPages = async () => {
    const res = await api.get('/pages');
    setPages(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await api.put(`/pages/${editing}`, form);
    } else {
      await api.post('/pages', form);
    }
    setForm({ title: '', content: '', slug: '', metaTitle: '', metaDescription: '' });
    setEditing(null);
    fetchPages();
  };

  const edit = (p) => {
    setForm({ title: p.title, content: p.content, slug: p.slug, metaTitle: p.metaTitle || '', metaDescription: p.metaDescription || '' });
    setEditing(p._id);
  };

  const del = async (id) => {
    await api.delete(`/pages/${id}`);
    fetchPages();
  };

  return (
    <div className="admin-page-content">
      <h1 className="admin-page-title">Pages</h1>
      <div className="admin-card">
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-grid">
            <div className="form-group"><label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="form-group"><label>Slug</label><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="Auto-generated if empty" /></div>
            <div className="form-group"><label>Meta Title</label><input value={form.metaTitle} onChange={e => setForm({ ...form, metaTitle: e.target.value })} /></div>
            <div className="form-group"><label>Meta Description</label><input value={form.metaDescription} onChange={e => setForm({ ...form, metaDescription: e.target.value })} /></div>
          </div>
          <div className="form-group"><label>Content (HTML)</label><textarea rows="10" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} /></div>
          <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
          {editing && <button type="button" className="btn" onClick={() => { setForm({ title: '', content: '', slug: '', metaTitle: '', metaDescription: '' }); setEditing(null); }}>Cancel</button>}
        </form>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Slug</th><th>Updated</th><th>Actions</th></tr></thead>
          <tbody>
            {pages.map(p => (
              <tr key={p._id}>
                <td>{p.title}</td><td>/{p.slug}</td>
                <td>{new Date(p.updatedAt).toLocaleDateString()}</td>
                <td className="action-cell">
                  <button onClick={() => edit(p)} className="btn-sm">✏️</button>
                  <button onClick={() => del(p._id)} className="btn-sm danger">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
