import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Message from '../components/Message';

export default function OtpLogin() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestOtp(email);
      setOtpSent(true);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-icon">⚓</span>
            <h1>{step === 'email' ? 'OTP Login' : 'Enter OTP'}</h1>
            <p>{step === 'email' ? 'Enter your email to receive a code' : `Code sent to ${email}`}</p>
          </div>
          {error && <Message variant="danger">{error}</Message>}
          {step === 'email' ? (
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="captain@example.com"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label>Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  required
                  autoFocus
                  style={{ fontSize: '1.5rem', letterSpacing: '8px', textAlign: 'center' }}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading || otp.length < 6}>
                {loading ? 'Verifying...' : 'Verify & Login →'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => { setStep('email'); setOtp(''); setOtpSent(false); }}
                style={{ marginTop: '8px' }}
              >
                Change Email
              </button>
            </form>
          )}
          <p className="auth-footer">
            Back to <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
