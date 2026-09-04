import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Message from '../components/Message';

export default function OtpRegister() {
  const [step, setStep] = useState('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const startCountdown = () => {
    setCountdown(60);
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter your name');
    setLoading(true);
    try {
      await requestOtp(email);
      setOtpSent(true);
      setStep('otp');
      startCountdown();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setLoading(true);
    try {
      await requestOtp(email);
      setOtpSent(true);
      startCountdown();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp(email, otp, name);
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
            <h1>{step === 'details' ? 'Join the Crew' : 'Verify Your Email'}</h1>
            <p>
              {step === 'details'
                ? 'Create your account with OTP verification'
                : `We sent a code to ${email}`}
            </p>
          </div>

          {error && <Message variant="danger">{error}</Message>}

          {step === 'details' ? (
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
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
                {loading ? 'Sending...' : 'Send Verification Code →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label>Enter 6-digit code</label>
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
                {loading ? 'Verifying...' : 'Verify & Create Account →'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={handleResend}
                disabled={countdown > 0}
                style={{ marginTop: '8px' }}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => { setStep('details'); setOtp(''); setOtpSent(false); }}
                style={{ marginTop: '8px' }}
              >
                Change Details
              </button>
            </form>
          )}

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
