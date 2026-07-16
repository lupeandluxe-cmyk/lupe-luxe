import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import Message from '../../components/Message';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.startsWith('/')
    ? window.location.origin
    : import.meta.env.VITE_API_URL.replace('/api', '')
  : window.location.origin;

export default function LiveChat() {
  const [chats, setChats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  const typingTimer = useRef(null);
  const selectedRef = useRef(null);

  useEffect(() => {
    api.get('/chats').then(({ data }) => {
      setChats(data);
      if (data.length > 0) setSelected(data[0]);
    }).catch(() => setError('Failed to load chats'))
    .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.messages, typing]);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  useEffect(() => {
    import('socket.io-client').then(({ io }) => {
      const s = io(SOCKET_URL, { reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000 });
      s.on('connect', () => {
        if (selectedRef.current) s.emit('chat:join', { chatId: selectedRef.current._id });
      });
      setSocket(s);
      return () => s.close();
    });
  }, []);

  useEffect(() => {
    if (!socket || !selected) return;
    socket.emit('chat:join', { chatId: selected._id });
    socket.on('message:new', (msg) => {
      setSelected((prev) => {
        if (!prev || prev._id !== selected._id) return prev;
        return { ...prev, messages: [...prev.messages, msg], unreadUser: 0 };
      });
      setChats((prev) => prev.map((c) =>
        c._id === selected._id ? { ...c, messages: [...(c.messages || []), msg], updatedAt: new Date().toISOString() } : c
      ));
    });
    socket.on('typing:display', ({ typing: t }) => setTyping(t));
    return () => {
      socket.emit('chat:leave', { chatId: selected._id });
      socket.off('message:new');
      socket.off('typing:display');
    };
  }, [socket, selected?._id]);

  const handleSelect = (chat) => {
    setSelected(chat);
    setChats((prev) => prev.map((c) => c._id === chat._id ? { ...c, unreadAgent: 0 } : c));
  };

  const handleSend = async () => {
    if (!input.trim() || !selected || !socket) return;
    const text = input.trim();
    setInput('');
    await socket.emit('message:send', { chatId: selected._id, text, sender: 'agent' });
  };

  const handleAssign = async (chat) => {
    try {
      const { data } = await api.put(`/chats/${chat._id}/assign`);
      socket?.emit('chat:assign', { chatId: chat._id });
      setChats((prev) => prev.map((c) => c._id === data._id ? { ...c, assignedTo: data.assignedTo } : c));
      if (selected?._id === data._id) setSelected((prev) => ({ ...prev, assignedTo: data.assignedTo }));
    } catch { setError('Assignment failed'); }
  };

  if (loading) return <div className="loader-container"><div className="loader"><div className="loader-ring" /><div className="loader-ring" /><div className="loader-ring" /></div><p className="loader-text">Loading chats...</p></div>;

  return (
    <div>
      <h1 className="admin-title" style={{ marginBottom: '1.5rem' }}>Live Chat</h1>
      {error && <Message variant="danger">{error}</Message>}

      <div className="admin-live-chat">
        <div className="chat-sidebar-admin">
          <h3 className="chat-sidebar-title">Active Conversations</h3>
          {chats.length === 0 ? (
            <p className="text-muted" style={{ padding: '1rem', textAlign: 'center', color: 'var(--gray-dark)' }}>No active chats</p>
          ) : (
            <div className="chat-list-admin">
              {chats.filter(c => c.status === 'active').map((chat) => (
                <button key={chat._id} className={`chat-list-item ${selected?._id === chat._id ? 'active' : ''}`} onClick={() => handleSelect(chat)}>
                  <div className="chat-list-item-top">
                    <span className="chat-list-name">{chat.user?.name || chat.guestName || 'Guest'}</span>
                    {(chat.unreadAgent || 0) > 0 && <span className="chat-unread-badge">{chat.unreadAgent}</span>}
                  </div>
                  <span className="chat-list-preview">{chat.messages?.[chat.messages.length - 1]?.text?.slice(0, 40)}...</span>
                  <span className="chat-list-time">{new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </button>
              ))}
              {chats.filter(c => c.status === 'closed').length > 0 && (
                <>
                  <div className="chat-list-divider">Closed</div>
                  {chats.filter(c => c.status === 'closed').map((chat) => (
                    <button key={chat._id} className={`chat-list-item closed ${selected?._id === chat._id ? 'active' : ''}`} onClick={() => handleSelect(chat)}>
                      <div className="chat-list-item-top">
                        <span className="chat-list-name">{chat.user?.name || chat.guestName || 'Guest'}</span>
                      </div>
                      <span className="chat-list-preview">Closed</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div className="chat-main-admin">
          {!selected ? (
            <div className="chat-empty-state">Select a conversation to start chatting</div>
          ) : (
            <>
              <div className="chat-main-header">
                <div>
                  <strong style={{ color: 'var(--white)' }}>{selected.user?.name || selected.guestName || 'Guest'}</strong>
                  <span style={{ color: 'var(--gray-dark)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{selected.user?.email || selected.guestEmail}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`badge ${selected.status === 'active' ? 'success' : 'muted'}`}>{selected.status}</span>
                  {!selected.assignedTo && (
                    <button className="btn btn-sm" style={{ background: 'var(--gold)', color: 'var(--black)', fontWeight: 700 }} onClick={() => handleAssign(selected)}>Accept Chat</button>
                  )}
                  {selected.assignedTo && <span style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>Assigned to {selected.assignedTo?.name || 'you'}</span>}
                </div>
              </div>

              <div className="chat-messages-admin">
                {selected.messages?.map((msg, i) => (
                  <div key={i} className={`chat-msg-admin ${msg.sender}`}>
                    <div className={`chat-bubble-admin ${msg.sender}`}>{msg.text}</div>
                    <span className="chat-msg-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
                {typing && <div className="chat-msg-admin agent"><div className="chat-bubble-admin agent typing"><span /><span /><span /></div></div>}
                <div ref={endRef} />
              </div>

              {selected.status === 'active' && (
                <div className="chat-input-admin">
                  <input
                    type="text"
                    className="coupon-input"
                    placeholder="Type a message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSend();
                      socket?.emit('typing:start', { chatId: selected._id, sender: 'agent' });
                    }}
                    onKeyUp={() => {
                      if (typingTimer.current) clearTimeout(typingTimer.current);
                      typingTimer.current = setTimeout(() => {
                        socket?.emit('typing:stop', { chatId: selected._id, sender: 'agent' });
                      }, 1000);
                    }}
                  />
                  <button className="coupon-apply-btn" onClick={handleSend} disabled={!input.trim()}>Send</button>
                  <button className="btn btn-sm" style={{ background: 'rgba(220,52,69,0.1)', color: 'var(--red)', border: '1px solid rgba(220,52,69,0.2)' }} onClick={async () => { try { await api.put(`/chats/${selected._id}/close`); setSelected((prev) => ({ ...prev, status: 'closed' })); setChats((prev) => prev.map((c) => c._id === selected._id ? { ...c, status: 'closed' } : c)); } catch {} }}>Close</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
