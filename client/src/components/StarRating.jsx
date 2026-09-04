export default function StarRating({ rating = 0, size = 14 }) {
  return (
    <span className="star-rating" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill={s <= Math.round(rating) ? 'var(--gold)' : 'none'}
          stroke={s <= Math.round(rating) ? 'var(--gold)' : 'var(--gray-dark)'}
          strokeWidth="1.5"
          style={{ marginRight: 2 }}
        >
          <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27 5.06 16.7 6 11.21l-4-3.9 5.53-.8z" />
        </svg>
      ))}
    </span>
  );
}
