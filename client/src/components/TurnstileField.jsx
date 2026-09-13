import { useEffect, useRef } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadTurnstile() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.turnstile) return Promise.resolve(true);
  const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
    });
  }
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export default function TurnstileField({ onVerify, resetSignal = 0 }) {
  const ref = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    let cancelled = false;
    if (!SITE_KEY) return undefined;
    loadTurnstile().then((loaded) => {
      if (cancelled || !loaded || !ref.current || !window.turnstile) return;
      if (widgetId.current !== null) {
        try {
          window.turnstile.reset(widgetId.current);
          return;
        } catch {
          /* fall through and render again */
        }
      }
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        theme: 'light',
        callback: (token) => onVerify?.(token),
        'expired-callback': () => onVerify?.(''),
        'error-callback': () => onVerify?.(''),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [onVerify, resetSignal]);

  useEffect(() => {
    if (SITE_KEY && widgetId.current !== null && window.turnstile) {
      try {
        window.turnstile.reset(widgetId.current);
      } catch {
        /* ignore */
      }
    }
  }, [resetSignal]);

  if (!SITE_KEY) return null;

  return (
    <div className="turnstile-wrap">
      <div ref={ref} />
      <p className="turnstile-note">Protected by Cloudflare Turnstile.</p>
    </div>
  );
}

export function isTurnstileConfigured() {
  return Boolean(SITE_KEY);
}
