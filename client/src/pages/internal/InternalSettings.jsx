import { useState } from 'react';
import { internalFetch } from '../../hooks/useInternalAuth';

export default function InternalSettings() {
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');

  const changePassword = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await internalFetch('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(pwForm),
      });
      if (res.message) setMsg(res.message);
      else setMsg('Password updated');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setMsg(err.message || 'Failed to update password');
    }
  };

  return (
    <div>
      <h2 className="internal-page-title">Settings</h2>
      <div className="internal-card" style={{ maxWidth: '500px' }}>
        <h3 style={{ marginBottom: '1rem' }}>Change Password</h3>
        {msg && <div className={`internal-alert ${msg.includes('Failed') || msg.includes('incorrect') ? 'danger' : 'success'}`}>{msg}</div>}
        <form onSubmit={changePassword}>
          <div style={{ marginBottom: '0.75rem' }}>
            <label className="internal-label">Current Password</label>
            <input type="password" className="internal-input" required
              value={pwForm.currentPassword}
              onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label className="internal-label">New Password</label>
            <input type="password" className="internal-input" required minLength={6}
              value={pwForm.newPassword}
              onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} />
          </div>
          <button type="submit" className="internal-btn primary">Update Password</button>
        </form>
      </div>
    </div>
  );
}
