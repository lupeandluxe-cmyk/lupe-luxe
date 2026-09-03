export default function DoodleAccents() {
  return (
    <div className="doodle-accents" aria-hidden="true">
      {/* Hero compass sketch */}
      <svg className="doodle doodle-compass" width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="28" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.18" />
        <circle cx="30" cy="30" r="20" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
        <line x1="30" y1="2" x2="30" y2="12" stroke="currentColor" strokeWidth="0.7" opacity="0.2" />
        <line x1="30" y1="48" x2="30" y2="58" stroke="currentColor" strokeWidth="0.7" opacity="0.2" />
        <line x1="2" y1="30" x2="12" y2="30" stroke="currentColor" strokeWidth="0.7" opacity="0.2" />
        <line x1="48" y1="30" x2="58" y2="30" stroke="currentColor" strokeWidth="0.7" opacity="0.2" />
        <polygon points="30,8 33,20 30,18 27,20" fill="currentColor" opacity="0.15" />
        <polygon points="30,52 33,40 30,42 27,40" fill="currentColor" opacity="0.10" />
        <text x="30" y="6" textAnchor="middle" fontSize="5" fill="currentColor" opacity="0.15" fontFamily="serif">N</text>
      </svg>

      {/* Hero star cluster */}
      <svg className="doodle doodle-stars" width="80" height="40" viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 8l1.5 4.5L18 14l-4.5 1.5L12 20l-1.5-4.5L6 14l4.5-1.5z" fill="currentColor" opacity="0.12" />
        <path d="M35 4l1 3L39 8l-3 1-1 3-1-3-3-1 3-1z" fill="currentColor" opacity="0.08" />
        <path d="M58 12l2 6L66 20l-6 2-2 6-2-6-6-2 6-2z" fill="currentColor" opacity="0.10" />
        <path d="M72 6l0.8 2.4L75 9l-2.2 0.6L72 12l-0.8-2.4L69 9l2.2-0.6z" fill="currentColor" opacity="0.06" />
      </svg>

      {/* Wave line */}
      <svg className="doodle doodle-wave" width="120" height="16" viewBox="0 0 120 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 10c8-8 16-8 24 0s16 8 24 0 16-8 24 0 16 8 24 0 16-8 24 0" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.12" fill="none" />
      </svg>

      {/* Arrow sketch */}
      <svg className="doodle doodle-arrow" width="50" height="20" viewBox="0 0 50 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 10h40" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" opacity="0.15" />
        <path d="M38 5l6 5-6 5" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" opacity="0.15" fill="none" />
      </svg>

      {/* Tiny sailing route dots */}
      <svg className="doodle doodle-route" width="100" height="30" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="15" r="2" fill="currentColor" opacity="0.10" />
        <circle cx="28" cy="10" r="1.5" fill="currentColor" opacity="0.08" />
        <circle cx="50" cy="18" r="2.5" fill="currentColor" opacity="0.10" />
        <circle cx="72" cy="8" r="1.5" fill="currentColor" opacity="0.07" />
        <circle cx="92" cy="15" r="2" fill="currentColor" opacity="0.10" />
        <path d="M10 15c8-5 16 3 24-2s16 7 24 0 16-8 24 2" stroke="currentColor" strokeWidth="0.4" strokeDasharray="3 4" opacity="0.08" fill="none" />
      </svg>

      {/* Small anchor */}
      <svg className="doodle doodle-anchor" width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="5" r="3" stroke="currentColor" strokeWidth="0.7" opacity="0.12" fill="none" />
        <line x1="12" y1="8" x2="12" y2="28" stroke="currentColor" strokeWidth="0.7" opacity="0.12" />
        <path d="M5 22c0 5 7 8 7 8s7-3 7-8" stroke="currentColor" strokeWidth="0.7" opacity="0.10" fill="none" />
        <line x1="12" y1="14" x2="8" y2="17" stroke="currentColor" strokeWidth="0.6" opacity="0.10" />
        <line x1="12" y1="14" x2="16" y2="17" stroke="currentColor" strokeWidth="0.6" opacity="0.10" />
      </svg>

      {/* Pencil/ink cross-hatch corner */}
      <svg className="doodle doodle-hatch" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="2" y1="2" x2="18" y2="18" stroke="currentColor" strokeWidth="0.4" opacity="0.08" />
        <line x1="6" y1="2" x2="22" y2="18" stroke="currentColor" strokeWidth="0.3" opacity="0.06" />
        <line x1="10" y1="2" x2="26" y2="18" stroke="currentColor" strokeWidth="0.3" opacity="0.05" />
        <line x1="2" y1="6" x2="18" y2="22" stroke="currentColor" strokeWidth="0.3" opacity="0.06" />
        <line x1="2" y1="10" x2="14" y2="22" stroke="currentColor" strokeWidth="0.3" opacity="0.05" />
      </svg>
    </div>
  );
}
