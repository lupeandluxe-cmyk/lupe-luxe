import { useState } from 'react';
import Message from './Message';
import TurnstileField, { isTurnstileConfigured } from './TurnstileField';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export default function NewsletterSignup({ contactEmail = '', source = 'website' }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const turnstileRequired = isTurnstileConfigured();

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!contactEmail) {
      setError('Newsletter signup is unavailable right now. Please try again later.');
      return;
    }
    if (turnstileRequired && !token) {
      setError('Please complete the security check before subscribing.');
      return;
    }
    const subject = encodeURIComponent(`Newsletter signup (${source}): ${value}`);
    const body = encodeURIComponent(`Please add ${value} to the Lupe & Luxe newsletter list.`);
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    setDone(true);
  };

  if (done) {
    return <Message variant="success">Thank you! Your email app should open so you can confirm your subscription.</Message>;
  }

  return (
    <form className="newsletter-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor={`newsletter-${source}`}>
        Email address
      </label>
      <input
        id={`newsletter-${source}`}
        type="email"
        className="newsletter-input"
        placeholder="Email address"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        required
      />
      <button type="submit" className="btn btn-dark">
        Subscribe
      </button>
      <div style={{ gridColumn: '1 / -1' }}>
        <TurnstileField onVerify={setToken} />
        {error && <Message variant="danger">{error}</Message>}
      </div>
    </form>
  );
}
