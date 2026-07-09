import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminHomepage() {
  const [sections, setSections] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ section: '', type: 'hero', title: '', subtitle: '', text: '', image: '', buttonText: '', buttonLink: '', images: [], items: [], order: 0, active: true });

  useEffect(() => { fetchSections(); }, []);

  const fetchSections = async () => {
    const res = await api.get('/homepage/all');
    setSections(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await api.put(`/homepage/${editing}`, form);
    } else {
      await api.post('/homepage', form);
    }
    setEditing(null);
    setForm({ section: '', type: 'hero', title: '', subtitle: '', text: '', image: '', buttonText: '', buttonLink: '', images: [], items: [], order: 0, active: true });
    fetchSections();
  };

  const edit = (sec) => {
    setForm(sec);
    setEditing(sec._id);
  };

  const del = async (id) => {
    await api.delete(`/homepage/${id}`);
    fetchSections();
  };

  const toggleActive = async (sec) => {
    await api.put(`/homepage/${sec._id}`, { active: !sec.active });
    fetchSections();
  };

  return (
    <div className="admin-page-content">
      <h1 className="admin-page-title">Homepage Builder</h1>
      <div className="admin-card">
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-grid">
            <div className="form-group"><label>Section Name</label><input value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} required /></div>
            <div className="form-group"><label>Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="hero">Hero</option><option value="banner">Banner</option><option value="featured">Featured</option>
              <option value="collection">Collection</option><option value="testimonial">Testimonial</option><option value="promo">Promo</option>
              <option value="newsletter">Newsletter</option><option value="announcement">Announcement</option>
            </select></div>
            <div className="form-group"><label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="form-group"><label>Subtitle</label><input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} /></div>
            <div className="form-group"><label>Image URL</label><input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} /></div>
            <div className="form-group"><label>Button Text</label><input value={form.buttonText} onChange={e => setForm({ ...form, buttonText: e.target.value })} /></div>
            <div className="form-group"><label>Button Link</label><input value={form.buttonLink} onChange={e => setForm({ ...form, buttonLink: e.target.value })} /></div>
            <div className="form-group"><label>Order</label><input type="number" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} /></div>
            <div className="form-group"><label><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active</label></div>
          </div>
          <div className="form-group"><label>Text / HTML</label><textarea rows="3" value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} /></div>
          <button type="submit" className="btn btn-primary">{editing ? 'Update Section' : 'Add Section'}</button>
          {editing && <button type="button" className="btn" onClick={() => { setEditing(null); setForm({ section: '', type: 'hero', title: '', subtitle: '', text: '', image: '', buttonText: '', buttonLink: '', images: [], items: [], order: 0, active: true }); }}>Cancel</button>}
        </form>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Section</th><th>Type</th><th>Title</th><th>Active</th><th>Order</th><th>Actions</th></tr></thead>
          <tbody>
            {sections.map(s => (
              <tr key={s._id}>
                <td>{s.section}</td><td>{s.type}</td><td>{s.title}</td>
                <td><span className={`badge ${s.active ? 'active' : 'inactive'}`} onClick={() => toggleActive(s)} style={{ cursor: 'pointer' }}>{s.active ? 'Yes' : 'No'}</span></td>
                <td>{s.order}</td>
                <td className="action-cell">
                  <button onClick={() => edit(s)} className="btn-sm">✏️</button>
                  <button onClick={() => del(s._id)} className="btn-sm danger">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
