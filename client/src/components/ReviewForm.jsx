import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Message from './Message';

export default function ReviewForm({ onSuccess }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="review-form-locked">
        <p>Please <a href="/login">sign in</a> to leave a review.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!text.trim()) return setError('Please write your review');
    setSubmitting(true);
    try {
      await api.post('/reviews', { rating, title: title.trim(), text: text.trim() });
      setSuccess('Review submitted! Thank you! ⚓');
      setTitle('');
      setText('');
      setRating(5);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      {error && <Message variant="danger">{error}</Message>}
      {success && <Message variant="success">{success}</Message>}
      <div className="review-stars-input">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            className={`review-star-btn ${s <= rating ? 'active' : ''}`}
            onClick={() => setRating(s)}
            aria-label={`${s} star${s > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>
      <input
        type="text"
        className="review-title-input"
        placeholder="Review title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
      />
      <textarea
        className="review-text-input"
        placeholder="Share your experience with Lupe & Luxe..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={1000}
        required
      />
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
