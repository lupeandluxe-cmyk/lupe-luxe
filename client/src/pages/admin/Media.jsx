import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminMedia() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchFiles(); }, []);

  const fetchFiles = async () => {
    const res = await api.get('/media');
    setFiles(res.data);
  };

  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'general');
    await api.post('/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setUploading(false);
    fetchFiles();
  };

  const deleteFile = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    await api.delete(`/media/${id}`);
    fetchFiles();
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    alert('URL copied!');
  };

  return (
    <div className="admin-page-content">
      <div className="page-header">
        <h1 className="admin-page-title">Media Library ({files.length})</h1>
        <label className="btn btn-primary" style={{ cursor: 'pointer' }}>{uploading ? 'Uploading...' : '+ Upload'}<input type="file" onChange={uploadFile} hidden accept="image/*,video/*" /></label>
      </div>
      <div className="media-grid">
        {files.map(f => (
          <div key={f._id} className="media-item">
            {f.mimetype?.startsWith('video') ? (
              <video src={f.url} className="media-preview" controls />
            ) : (
              <img src={f.url} alt={f.filename} className="media-preview" />
            )}
            <div className="media-actions">
              <button onClick={() => copyUrl(f.url)} className="btn-sm">📋</button>
              <button onClick={() => deleteFile(f._id)} className="btn-sm danger">🗑️</button>
            </div>
            <div className="media-filename" title={f.filename}>{f.filename?.slice(0, 20)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
