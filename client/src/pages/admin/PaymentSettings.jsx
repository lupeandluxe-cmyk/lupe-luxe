import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Message from '../../components/Message';

const SECTIONS = [
  { key: 'razorpay', label: 'Razorpay', icon: '💳' },
  { key: 'upi', label: 'UPI QR', icon: '📱' },
  { key: 'cod', label: 'Cash on Delivery', icon: '💵' },
  { key: 'email', label: 'Email', icon: '📧' },
];

export default function PaymentSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('razorpay');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      setSettings(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const update = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'settings');
    try {
      const { data } = await api.post('/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      update('upiQrImage', data.url);
    } catch {
      setError('Upload failed');
    }
  };

  const deleteQr = () => {
    update('upiQrImage', '');
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setMsg('');
    try {
      const bulk = [
        { key: 'razorpayEnabled', value: settings.razorpayEnabled === true || settings.razorpayEnabled === 'true' ? 'true' : 'false' },
        { key: 'razorpayKeyId', value: settings.razorpayKeyId || '' },
        { key: 'razorpayKeySecret', value: settings.razorpayKeySecret || '' },
        { key: 'razorpayTestMode', value: settings.razorpayTestMode === true || settings.razorpayTestMode === 'true' ? 'true' : 'false' },
        { key: 'upiEnabled', value: settings.upiEnabled === true || settings.upiEnabled === 'true' ? 'true' : 'false' },
        { key: 'upiQrImage', value: settings.upiQrImage || '' },
        { key: 'upiId', value: settings.upiId || '' },
        { key: 'upiHolderName', value: settings.upiHolderName || '' },
        { key: 'codEnabled', value: settings.codEnabled === true || settings.codEnabled === 'true' ? 'true' : 'false' },
        { key: 'emailNotifications', value: settings.emailNotifications === true || settings.emailNotifications === 'true' ? 'true' : 'false' },
        { key: 'emailUser', value: settings.emailUser || '' },
        { key: 'emailPass', value: settings.emailPass || '' },
      ];
      await api.post('/settings/bulk', { settings: bulk });
      setMsg('Payment settings saved!');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const isChecked = (key) => settings[key] === true || settings[key] === 'true';

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-page-content">
      <h1 className="admin-page-title">Payment Settings</h1>

      {msg && <Message variant="success">{msg}</Message>}
      {error && <Message variant="danger">{error}</Message>}

      <div className="settings-layout">
        <div className="settings-tabs">
          {SECTIONS.map(s => (
            <button key={s.key} className={`settings-tab ${activeTab === s.key ? 'active' : ''}`} onClick={() => setActiveTab(s.key)}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        <div className="admin-card settings-panel">
          {/* Razorpay */}
          {activeTab === 'razorpay' && (
            <>
              <h3>💳 Razorpay</h3>
              <p className="settings-desc">Accept payments via Razorpay (UPI, Credit/Debit Cards, Net Banking, Wallet)</p>

              <div className="form-group">
                <label className="toggle-group">
                  <span>Enable Razorpay</span>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={isChecked('razorpayEnabled')} onChange={(e) => update('razorpayEnabled', e.target.checked)} />
                    <span className="toggle-slider"></span>
                  </label>
                </label>
              </div>

              <div className="form-group">
                <label>Key ID</label>
                <input type="text" value={settings.razorpayKeyId || ''} onChange={e => update('razorpayKeyId', e.target.value)} placeholder="rzp_live_..." />
                <small>Your Razorpay API Key ID from the Razorpay Dashboard</small>
              </div>

              <div className="form-group">
                <label>Key Secret</label>
                <input type="password" value={settings.razorpayKeySecret || ''} onChange={e => update('razorpayKeySecret', e.target.value)} placeholder="Enter secret key" />
                <small>Your Razorpay API Key Secret</small>
              </div>

              <div className="form-group">
                <label className="toggle-group">
                  <span>Test Mode</span>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={isChecked('razorpayTestMode')} onChange={(e) => update('razorpayTestMode', e.target.checked)} />
                    <span className="toggle-slider"></span>
                  </label>
                </label>
                <small>Enable to use Razorpay test keys. Disable for live payments.</small>
              </div>
            </>
          )}

          {/* UPI QR */}
          {activeTab === 'upi' && (
            <>
              <h3>📱 UPI QR Payment</h3>
              <p className="settings-desc">Accept payments via UPI QR code (GPay, PhonePe, PayTM, etc.)</p>

              <div className="form-group">
                <label className="toggle-group">
                  <span>Enable UPI QR</span>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={isChecked('upiEnabled')} onChange={(e) => update('upiEnabled', e.target.checked)} />
                    <span className="toggle-slider"></span>
                  </label>
                </label>
              </div>

              <div className="payment-settings-qr-block">
                <label>QR Code Image</label>
                <div className="qr-upload-area">
                  {settings.upiQrImage ? (
                    <div className="qr-preview-wrap">
                      <img src={settings.upiQrImage} alt="UPI QR" className="qr-preview" />
                      <div className="qr-actions">
                        <label className="btn-sm" style={{ cursor: 'pointer', background: 'rgba(200,168,124,0.15)', color: 'var(--gold)', border: '1px solid rgba(200,168,124,0.3)', borderRadius: '6px', padding: '0.3rem 0.75rem' }}>
                          Change <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleUpload} />
                        </label>
                        <button className="btn-sm" style={{ background: 'rgba(192,57,43,0.15)', color: '#e74c3c', border: '1px solid rgba(192,57,43,0.3)', borderRadius: '6px' }} onClick={deleteQr}>Delete</button>
                      </div>
                    </div>
                  ) : (
                    <label className="qr-upload-placeholder">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <span>Click to upload QR code</span>
                      <span className="upload-hint">PNG, JPG or WebP</span>
                      <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleUpload} />
                    </label>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>UPI ID</label>
                <input type="text" value={settings.upiId || ''} onChange={e => update('upiId', e.target.value)} placeholder="e.g. name@upi" />
                <small>Your UPI VPA (Virtual Payment Address)</small>
              </div>

              <div className="form-group">
                <label>Account Holder Name</label>
                <input type="text" value={settings.upiHolderName || ''} onChange={e => update('upiHolderName', e.target.value)} placeholder="e.g. Lupe &amp; Luxe" />
                <small>Displayed to customers when they scan the QR</small>
              </div>
            </>
          )}

          {/* COD */}
          {activeTab === 'cod' && (
            <>
              <h3>💵 Cash on Delivery</h3>
              <p className="settings-desc">Accept payments in cash when the order is delivered</p>

              <div className="form-group">
                <label className="toggle-group">
                  <span>Enable Cash on Delivery</span>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={isChecked('codEnabled')} onChange={(e) => update('codEnabled', e.target.checked)} />
                    <span className="toggle-slider"></span>
                  </label>
                </label>
              </div>
            </>
          )}

          {/* Email */}
          {activeTab === 'email' && (
            <>
              <h3>📧 Email Notifications</h3>
              <p className="settings-desc">Send email notifications when new orders are placed. Uses Gmail's SMTP server.</p>

              <div className="form-group">
                <label className="toggle-group">
                  <span>Enable Email Notifications</span>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={isChecked('emailNotifications')} onChange={(e) => update('emailNotifications', e.target.checked)} />
                    <span className="toggle-slider"></span>
                  </label>
                </label>
              </div>

              <div className="form-group">
                <label>Gmail Address</label>
                <input type="email" value={settings.emailUser || ''} onChange={e => update('emailUser', e.target.value)} placeholder="lupeandluxe@gmail.com" />
                <small>The Gmail address used to send emails</small>
              </div>

              <div className="form-group">
                <label>App Password</label>
                <input type="password" value={settings.emailPass || ''} onChange={e => update('emailPass', e.target.value)} placeholder="16-character app password" />
                <small>
                  Gmail requires an App Password (not your regular password). 
                  Generate one at{' '}
                  <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>
                    Google App Passwords
                  </a>
                </small>
              </div>
            </>
          )}

          <div className="settings-save-bar">
            <button className="btn btn-primary btn-lg" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
