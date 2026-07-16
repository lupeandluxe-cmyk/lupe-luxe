export default function Loader({ text = 'Setting sail...' }) {
  return (
    <div className="loader">
      <div className="loader-dots">
        <span /><span /><span />
      </div>
      <p className="loader-text">{text}</p>
    </div>
  );
}
