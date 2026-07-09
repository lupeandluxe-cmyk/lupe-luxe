import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', image: '' });
  const [editing, setEditing] = useState(null);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    const res = await api.get('/categories/all');
    setCategories(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await api.put(`/categories/${editing}`, form);
    } else {
      await api.post('/categories', form);
    }
    setForm({ name: '', description: '', image: '' });
    setEditing(null);
    fetchCategories();
  };

  const edit = (cat) => {
    setForm({ name: cat.name, description: cat.description || '', image: cat.image || '' });
    setEditing(cat._id);
  };

  const deleteCat = async (id) => {
    await api.delete(`/categories/${id}`);
    fetchCategories();
  };

  return (
    <div className="admin-page-content">
      <h1 className="admin-page-title">Categories</h1>
      <div className="admin-card">
        <form onSubmit={handleSubmit} className="admin-form inline-form">
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <input placeholder="Image URL" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
          <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add'}</button>
          {editing && <button type="button" className="btn" onClick={() => { setForm({ name: '', description: '', image: '' }); setEditing(null); }}>Cancel</button>}
        </form>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Slug</th><th>Products</th><th>Actions</th></tr></thead>
          <tbody>
            {categories.map(c => (
              <tr key={c._id}><td>{c.name}</td><td>{c.slug}</td><td>-</td>
                <td className="action-cell">
                  <button onClick={() => edit(c)} className="btn-sm">✏️</button>
                  <button onClick={() => deleteCat(c._id)} className="btn-sm danger">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
