import { useState, useEffect } from 'react';
import api from '../../api/axios';

const settingGroups = [
  {
    title: 'General', key: 'general',
    fields: [
      { key: 'siteName', label: 'Site Name', type: 'text', default: 'Lupe & Luxe' },
      { key: 'siteDescription', label: 'Site Description', type: 'text', default: 'Premium Thrift & Custom Clothing' },
      { key: 'currency', label: 'Currency', type: 'text', default: 'INR' },
      { key: 'currencySymbol', label: 'Currency Symbol', type: 'text', default: '₹' },
    ],
  },
  {
    title: 'Contact & Social', key: 'contact',
    fields: [
      { key: 'contactEmail', label: 'Contact Email', type: 'text' },
      { key: 'contactPhone', label: 'Contact Phone', type: 'text' },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'facebook', label: 'Facebook URL', type: 'text' },
      { key: 'instagram', label: 'Instagram URL', type: 'text' },
      { key: 'twitter', label: 'Twitter URL', type: 'text' },
      { key: 'youtube', label: 'YouTube URL', type: 'text' },
    ],
  },
  {
    title: 'Branding', key: 'branding',
    fields: [
      { key: 'logo', label: 'Logo URL', type: 'text' },
      { key: 'favicon', label: 'Favicon URL', type: 'text' },
      { key: 'primaryColor', label: 'Primary Color', type: 'text', default: '#c8a87c' },
      { key: 'secondaryColor', label: 'Secondary Color', type: 'text', default: '#1a1a2e' },
    ],
  },
  {
    title: 'Shipping', key: 'shipping',
    fields: [
      { key: 'shippingCharge', label: 'Shipping Charge (₹)', type: 'number', default: '199' },
      { key: 'freeShippingMin', label: 'Free Shipping Min (₹)', type: 'number', default: '3999' },
      { key: 'estimatedDelivery', label: 'Est. Delivery (days)', type: 'text', default: '5-7' },
    ],
  },
  {
    title: 'Pricing', key: 'pricing',
    fields: [
      { key: 'taxRate', label: 'Tax Rate (%)', type: 'number', default: '12' },
      { key: 'codFee', label: 'COD Fee (₹)', type: 'number', default: '0' },
    ],
  },
  {
    title: 'UPI Payment', key: 'upi',
    fields: [
      { key: 'upiQrImage', label: 'UPI QR Code Image URL', type: 'text' },
      { key: 'upiId', label: 'UPI ID (e.g., name@upi)', type: 'text' },
      { key: 'upiHolderName', label: 'UPI Account Holder Name', type: 'text' },
    ],
  },
  {
    title: 'SEO', key: 'seo',
    fields: [
      { key: 'metaTitle', label: 'Default Meta Title', type: 'text' },
      { key: 'metaDescription', label: 'Default Meta Description', type: 'text' },
      { key: 'ogImage', label: 'OG Image URL', type: 'text' },
    ],
  },
  {
    title: 'Announcement Bar', key: 'announcement',
    fields: [
      { key: 'announcementText', label: 'Announcement Text', type: 'text', default: '✦ Free shipping on orders over ₹3,999 ✦' },
      { key: 'announcementActive', label: 'Show Announcement', type: 'text', default: 'true' },
    ],
  },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(settingGroups[0].key);

  useEffect(() => {
    api.get('/settings').then(res => setSettings(res.data)).catch(() => {});
  }, []);

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const saveAll = async () => {
    setSaving(true);
    const bulk = Object.entries(settings).map(([key, value]) => ({ key, value }));
    await api.post('/settings/bulk', { settings: bulk });
    setSaving(false);
    alert('Settings saved!');
  };

  const uploadImage = async (key, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'settings');
    const res = await api.post('/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    updateSetting(key, res.data.url);
  };

  const currentGroup = settingGroups.find(g => g.key === activeTab);

  return (
    <div className="admin-page-content">
      <h1 className="admin-page-title">Settings</h1>
      <div className="settings-layout">
        <div className="settings-tabs">
          {settingGroups.map(g => (
            <button key={g.key} className={`settings-tab ${activeTab === g.key ? 'active' : ''}`} onClick={() => setActiveTab(g.key)}>{g.title}</button>
          ))}
        </div>
        <div className="admin-card settings-panel">
          <h3>{currentGroup?.title}</h3>
          {currentGroup?.fields.map(f => (
            <div key={f.key} className="form-group">
              <label>{f.label}</label>
              {f.key === 'logo' || f.key === 'favicon' || f.key === 'upiQrImage' || f.key === 'ogImage' ? (
                <div className="image-setting-row">
                  <input value={settings[f.key] || ''} onChange={e => updateSetting(f.key, e.target.value)} placeholder={f.default || ''} />
                  <label className="btn-sm" style={{ cursor: 'pointer' }}>Upload<input type="file" hidden onChange={e => uploadImage(f.key, e)} /></label>
                  {settings[f.key] && <img src={settings[f.key]} alt="" className="setting-preview" />}
                </div>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={settings[f.key] ?? f.default ?? ''}
                  onChange={e => updateSetting(f.key, e.target.value)}
                  placeholder={f.default || ''}
                />
              )}
            </div>
          ))}
          <button className="btn btn-primary" onClick={saveAll} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
        </div>
      </div>
    </div>
  );
}
