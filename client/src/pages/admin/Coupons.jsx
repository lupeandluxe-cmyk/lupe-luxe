import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({ code: '', discount: '', type: 'percentage', minOrder: '0', maxUses: '', expiresAt: '' });

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    const res = await api.get('/coupons');
    setCoupons(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/coupons', { ...form, discount: Number(form.discount), minOrder: Number(form.minOrder), maxUses: form.maxUses ? Number(form.maxUses) : undefined });
    setForm({ code: '', discount: '', type: 'percentage', minOrder: '0', maxUses: '', expiresAt: '' });
    fetchCoupons();
  };

  const deleteCoupon = async (id) => {
    await api.delete(`/coupons/${id}`);
    fetchCoupons();
  };

  return (
    <div className="admin-page-content">
      <h1 className="admin-page-title">Coupons</h1>
      <div className="admin-card">
        <form onSubmit={handleSubmit} className="admin-form inline-form">
          <input placeholder="Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
          <input type="number" placeholder="Discount" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} required />
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="percentage">%</option><option value="fixed">Fixed</option>
          </select>
          <input type="number" placeholder="Min Order" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })} />
          <input type="number" placeholder="Max Uses" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} />
          <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
          <button type="submit" className="btn btn-primary">Add</button>
        </form>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Code</th><th>Discount</th><th>Type</th><th>Used</th><th>Expires</th><th>Actions</th></tr></thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c._id}>
                <td><strong>{c.code}</strong></td>
                <td>{c.type === 'percentage' ? `${c.discount}%` : `₹${c.discount}`}</td>
                <td>{c.type}</td>
                <td>{c.usedCount}/{c.maxUses || '∞'}</td>
                <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}</td>
                <td className="action-cell"><button onClick={() => deleteCoupon(c._id)} className="btn-sm danger">🗑️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
