export default function Message({ variant = 'info', children }) {
  const icons = {
    success: '✦',
    danger: '☠',
    warning: '⚡',
    info: '➜',
  };
  return (
    <div className={`message message-${variant}`}>
      <span className="message-icon">{icons[variant] || icons.info}</span>
      <span>{children}</span>
    </div>
  );
}
