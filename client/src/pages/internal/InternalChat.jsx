import { useState, useEffect, useRef } from 'react';
import { internalFetch } from '../../hooks/useInternalAuth';

export default function InternalChat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [employees, setEmployees] = useState([]);
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    Promise.all([
      internalFetch('/messages?type=private'),
      internalFetch('/employees/online'),
    ]).then(([msgData, empData]) => {
      setMessages(msgData || []);
      setEmployees(empData || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const send = async () => {
    if (!text.trim()) return;
    const body = { text: text.trim(), type: 'private' };
    if (recipient) body.recipients = [recipient];
    try {
      const msg = await internalFetch('/messages', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (msg._id) {
        setMessages(prev => [...prev, msg]);
        setText('');
      }
    } catch {}
  };

  if (loading) return <div className="internal-loader"><div className="internal-spinner" /></div>;

  return (
    <div className="internal-chat-page">
      <div className="internal-chat-sidebar">
        <h3 className="internal-chat-sidebar-title">Team</h3>
        <div className="internal-chat-employees">
          {employees.map(emp => (
            <div key={emp._id} className={`internal-chat-emp ${recipient === emp._id ? 'active' : ''}`} onClick={() => setRecipient(emp._id)}>
              <span className="internal-online-dot" />
              <span>{emp.name}</span>
              <span className="internal-emp-role">{emp.role?.name || 'Employee'}</span>
            </div>
          ))}
          {employees.length === 0 && <p style={{ padding: '1rem', color: 'var(--gray-dark)' }}>No one online</p>}
        </div>
      </div>
      <div className="internal-chat-main">
        <div className="internal-chat-messages">
          {messages.map(m => (
            <div key={m._id} className={`internal-chat-msg ${m.sender === 'you' ? 'own' : 'other'}`}>
              <div className="internal-chat-sender">{m.sender?.name || 'System'}</div>
              <div className="internal-chat-bubble">{m.text}</div>
              <div className="internal-chat-time">{new Date(m.createdAt).toLocaleTimeString()}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="internal-chat-input-row">
          <input type="text" className="internal-input" value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type a message..." />
          <button onClick={send} className="internal-btn primary">Send</button>
        </div>
      </div>
    </div>
  );
}
