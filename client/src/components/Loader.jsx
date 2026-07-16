export default function Loader({ text = 'Setting sail...' }) {
  return (
    <div className="loader-container">
      <div className="loader">
        <div className="loader-ring" />
        <div className="loader-ring" />
        <div className="loader-ring" />
      </div>
      <p className="loader-text">{text}</p>
    </div>
  );
}
