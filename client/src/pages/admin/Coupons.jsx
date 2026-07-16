import { useState, useEffect } from 'react';
import api from '../../api/axios';

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

const emptyForm = () => ({
  _id: '', code: '', discount: '', type: 'percentage', minOrder: '0',
  maxDiscount: '', maxUses: '', perUserLimit: '1', expiresAt: '', active: true,
});

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCoupons(); }, []);

  const buildQuery = () => {
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (filterType) params.type = filterType;
    if (filterActive) params.active = filterActive;
    return params;
  };

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/coupons', { params: buildQuery() });
      setCoupons(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load coupons');
    }
  };

  useEffect(() => { fetchCoupons(); }, [search, filterType, filterActive]);

  const resetForm = () => { setForm(emptyForm()); setEditing(false); setError(''); };

  const handleEdit = (c) => {
    setForm({
      _id: c._id, code: c.code, discount: String(c.discount), type: c.type,
      minOrder: String(c.minOrder || 0), maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '',
      maxUses: c.maxUses ? String(c.maxUses) : '', perUserLimit: String(c.perUserLimit || 1),
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().split('T')[0] : '',
      active: c.active,
    });
    setEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim(),
        discount: Number(form.discount),
        type: form.type,
        minOrder: Number(form.minOrder) || 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        perUserLimit: Number(form.perUserLimit) || 1,
        expiresAt: form.expiresAt || undefined,
        active: form.active,
      };
      if (editing) {
        await api.put(`/coupons/${form._id}`, payload);
        setSuccess('Coupon updated');
      } else {
        await api.post('/coupons', payload);
        setSuccess('Coupon created');
      }
      resetForm();
      fetchCoupons();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save coupon');
    }
    setSaving(false);
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      setSuccess('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const toggleActive = async (coupon) => {
    try {
      await api.put(`/coupons/${coupon._id}`, { active: !coupon.active });
      setSuccess(`Coupon ${coupon.active ? 'deactivated' : 'activated'}`);
      fetchCoupons();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle coupon status');
    }
  };

  const now = new Date();

  return (
    <div className="admin-page-content">
      <h1 className="admin-page-title">Coupons</h1>

      {error && <div className="admin-form-error">{error}</div>}
      {success && <div className="admin-form-success">{success}</div>}

      {/* Search & Filters */}
      <div className="admin-card">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="Search code..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '200px' }} />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: '140px' }}>
            <option value="">All Types</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
            <option value="free_shipping">Free Shipping</option>
          </select>
          <select value={filterActive} onChange={e => setFilterActive(e.target.value)} style={{ width: '130px' }}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button onClick={resetForm} className="btn-sm" style={{ marginLeft: 'auto' }}>
            {editing ? 'Cancel Edit' : '+ New'}
          </button>
        </div>
      </div>

      {/* Create / Edit Form */}
      {(editing || form.code) && (
        <div className="admin-card">
          <h3>{editing ? 'Edit Coupon' : 'New Coupon'}</h3>
          <form onSubmit={handleSubmit} className="admin-form" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'end' }}>
              <div className="form-group" style={{ flex: '1', minWidth: '140px', margin: 0 }}>
                <label>Code</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required style={{ flex: 1 }} />
                  {!editing && <button type="button" className="btn-sm" onClick={() => setForm({ ...form, code: generateCode() })} title="Generate random code">🎲</button>}
                </div>
              </div>
              <div className="form-group" style={{ flex: '1', minWidth: '100px', margin: 0 }}>
                <label>Discount</label>
                <input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} required />
              </div>
              <div className="form-group" style={{ flex: '0 0 130px', margin: 0 }}>
                <label>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="percentage">%</option>
                  <option value="fixed">₹ Fixed</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: '1', minWidth: '110px', margin: 0 }}>
                <label>Min Order (₹)</label>
                <input type="number" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })} />
              </div>
              {form.type === 'percentage' && (
                <div className="form-group" style={{ flex: '1', minWidth: '110px', margin: 0 }}>
                  <label>Max Discount (₹)</label>
                  <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} />
                </div>
              )}
              <div className="form-group" style={{ flex: '1', minWidth: '100px', margin: 0 }}>
                <label>Max Uses</label>
                <input type="number" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: '1', minWidth: '100px', margin: 0 }}>
                <label>Per User</label>
                <input type="number" value={form.perUserLimit} onChange={e => setForm({ ...form, perUserLimit: e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: '1', minWidth: '130px', margin: 0 }}>
                <label>Expires</label>
                <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--gray)', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                Active
              </label>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginLeft: 'auto' }}>
                {saving ? 'Saving...' : (editing ? 'Update Coupon' : 'Create Coupon')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupon Table */}
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Min Order</th>
              <th>Used</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--gray)' }}>No coupons found</td></tr>
            )}
            {coupons.map(c => {
              const expired = c.expiresAt && new Date(c.expiresAt) < now;
              return (
                <tr key={c._id} style={expired ? { opacity: 0.6 } : {}}>
                  <td><strong>{c.code}</strong></td>
                  <td>
                    {c.type === 'free_shipping' ? 'Free Shipping' : (
                      <>{c.type === 'percentage' ? `${c.discount}%` : `₹${c.discount}`}{c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}</>
                    )}
                  </td>
                  <td>{c.minOrder > 0 ? `₹${c.minOrder}` : 'None'}</td>
                  <td>{c.usedCount}/{c.maxUses || '∞'}</td>
                  <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}{expired ? ' ⚠️' : ''}</td>
                  <td>
                    <button onClick={() => toggleActive(c)} className="btn-sm" style={{
                      background: 'none', border: '1px solid', borderRadius: '4px', cursor: 'pointer',
                      color: c.active ? '#2ecc71' : '#e74c3c', padding: '2px 8px', fontSize: '0.8rem', fontWeight: 600,
                    }}>
                      {c.active ? 'Active' : 'Inactive'}
                    </button>
                    {expired && <span style={{ display: 'block', fontSize: '0.65rem', color: '#e74c3c', marginTop: '2px' }}>Expired</span>}
                  </td>
                  <td className="action-cell">
                    <button onClick={() => handleEdit(c)} className="btn-sm" title="Edit">✏️</button>
                    <button onClick={() => deleteCoupon(c._id)} className="btn-sm btn-danger" title="Delete">🗑️</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}