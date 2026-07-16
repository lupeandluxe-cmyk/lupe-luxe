import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Message from '../components/Message';
import Loader from '../components/Loader';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/mine')
      .then(({ data }) => setOrders(data))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password && password !== confirm) return setError('Passwords do not match');
    try {
      setSaving(true);
      setError('');
      await updateProfile({ name, email, password: password || undefined });
      setMsg('Profile updated!');
      setPassword('');
      setConfirm('');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <span className="profile-doodle profile-doodle-1">✦</span>
      <span className="profile-doodle profile-doodle-2">✧</span>
      <div className="container">
        <div className="profile-layout">
          <div className="profile-box">
            <h2>Account Details</h2>
            {msg && <Message variant="success">{msg}</Message>}
            {error && <Message variant="danger">{error}</Message>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>New Password (leave blank to keep)</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Update Profile'}
              </button>
            </form>
          </div>

          <div className="profile-orders">
            <h2>My Orders</h2>
            {ordersLoading ? <Loader /> : orders.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🏴‍☠️</span>
                <p>No orders yet. Time to find treasure!</p>
              </div>
            ) : (
              <div className="order-list">
                {orders.map((o) => (
                  <Link to={`/order/${o._id}`} key={o._id} className="order-row">
                    <div className="order-row-info">
                      <span className="order-id">#{o._id.slice(-8).toUpperCase()}</span>
                      <span className="order-date">{new Date(o.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="order-row-status">
                      {o.paymentMethod === 'upi' && o.upiPaymentStatus ? (
                        <span className={
                          o.upiPaymentStatus === 'verified' ? 'badge-success' :
                          o.upiPaymentStatus === 'rejected' ? 'badge-danger' : 'badge-warning'
                        }>
                          {o.upiPaymentStatus === 'verified' ? 'Payment Verified' :
                           o.upiPaymentStatus === 'rejected' ? 'Payment Failed' : 'Verify Pending'}
                        </span>
                      ) : (
                        <span className={o.isPaid ? 'badge-success' : 'badge-gray'}>
                          {o.isPaid ? 'Paid' : 'Pending'}
                        </span>
                      )}
                      <span className={o.isDelivered ? 'badge-success' : 'badge-gray'}>
                        {o.isDelivered ? 'Delivered' : 'Shipping'}
                      </span>
                    </div>
                    <span className="order-row-total">₹{o.totalPrice.toFixed(2)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
