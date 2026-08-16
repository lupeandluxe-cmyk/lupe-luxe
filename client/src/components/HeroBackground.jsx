export default function HeroBackground({ poster }) {
  return poster ? <img src={poster} alt="" className="hero-canvas-fallback" /> : null;
}