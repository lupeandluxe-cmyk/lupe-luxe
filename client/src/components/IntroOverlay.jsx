import { useEffect, useState } from 'react';

export default function IntroOverlay({ onDone }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      setDone(true);
      document.body.style.overflow = prevOverflow;
      onDone?.();
    }, 4350);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (done) return null;

  return (
    <div className="intro" aria-hidden="true">
      <div className="intro-logo">
        <h1>LUPE &amp; LUXE</h1>
        <p>CHAPTER I — 2026</p>
      </div>
      <div className="slash slash-one" />
      <div className="slash slash-two" />
      <div className="cut-piece piece-one" />
      <div className="cut-piece piece-two" />
      <div className="cut-piece piece-three" />
      <div className="cut-piece piece-four" />
      <div className="flash" />
    </div>
  );
}