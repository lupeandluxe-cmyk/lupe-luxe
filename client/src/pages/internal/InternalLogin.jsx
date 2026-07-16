import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useInternalAuth from '../../hooks/useInternalAuth';

export default function InternalLogin() {
  const { login } = useInternalAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin/internal/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="internal-login-page">
      <div className="internal-login-card">
        <div className="internal-login-logo">☠</div>
        <h1 className="internal-login-title">Internal Portal</h1>
        <p className="internal-login-subtitle">Lupe & Luxe — Employee Access</p>
        {error && <div className="internal-alert danger">{error}</div>}
        <form onSubmit={handleSubmit} className="internal-login-form">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="internal-input" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="internal-input" required />
          <button type="submit" className="internal-btn primary" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <a href="/" className="internal-back-link" style={{ marginTop: '1rem', display: 'block', textAlign: 'center' }}>← Back to Website</a>
      </div>
    </div>
  );
}
