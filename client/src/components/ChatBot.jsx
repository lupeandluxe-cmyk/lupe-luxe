import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : window.location.origin;

const FAQ = [
  { q: ['shipping', 'delivery', 'how long', 'ship', 'arrive'], a: 'Orders are processed within 1-2 business days. Domestic shipping takes 3-7 days, international 7-14 days. You\'ll receive a tracking link once shipped.' },
  { q: ['return', 'refund', 'exchange', 'cancel'], a: 'We accept returns within 7 days of delivery. Items must be unworn with tags attached. Custom pieces are final sale. Initiate returns from your profile page.' },
  { q: ['size', 'fit', 'measurement', 'sizing chart'], a: 'Each product page has size options. If unsure, go one size up for an oversized fit. Contact us for custom sizing on premium pieces.' },
  { q: ['payment', 'pay', 'razorpay', 'upi', 'cod'], a: 'We accept Razorpay (cards, UPI, net banking), UPI QR (GPay/PhonePe/PayTM), and Cash on Delivery. All payments are secure.' },
  { q: ['order', 'track', 'status', 'where is my'], a: 'Check your order status anytime from your Profile page. You\'ll see real-time updates on payment verification and shipping.' },
  { q: ['contact', 'support', 'help', 'email', 'phone'], a: 'Reach us at lupeandluxe@gmail.com. We respond within 24 hours. For urgent queries, DM us on Instagram.' },
  { q: ['product', 'custom', 'design', 'customize'], a: 'Yes! We offer custom designs. Browse our Custom Tees category or contact us with your design idea and we\'ll create something unique.' },
  { q: ['discount', 'coupon', 'promo', 'offer', 'sale'], a: 'Apply coupon codes at checkout. Follow us on Instagram for exclusive drops and limited-time offers. New crew members get welcome discounts!' },
  { q: ['premium', 'featured', 'limited', 'drop'], a: 'Limited Drops are our most exclusive pieces — each numbered and released in small batches. Check the Limited Drops category for current availability.' },
  { q: ['hello', 'hi', 'hey', 'help', 'start'], a: 'Ahoy, Captain! ⚓ Welcome to Lupe & Luxe. I can help with orders, shipping, sizing, payments, or anything else. Just ask!' },
  { q: ['human', 'agent', 'real person', 'talk to', 'support'], a: 'AGENT_REQUEST' },
];

function findAnswer(input) {
  const text = input.toLowerCase().trim();
  if (!text) return FAQ[FAQ.length - 2].a;
  for (const item of FAQ) {
    for (const kw of item.q) {
      if (text.includes(kw)) {
        if (item.a === 'AGENT_REQUEST') return 'AGENT_REQUEST';
        return item.a;
      }
    }
  }
  return FAQ[FAQ.length - 2].a;
}

export default function ChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 0, text: 'Ahoy Captain! ⚓ Ask me anything about Lupe & Luxe.', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [agentActive, setAgentActive] = useState(false);
  const [socket, setSocket] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (chatId) connectSocket(chatId);
  }, [chatId, open]);

  const connectSocket = (id) => {
    import('socket.io-client').then(({ io }) => {
      const s = io(SOCKET_URL);
      s.emit('chat:join', { chatId: id });
      s.on('message:new', (msg) => {
        if (msg.sender === 'user') return;
        setMessages((prev) => [...prev, { id: Date.now(), text: msg.text, sender: 'agent' }]);
      });
      s.on('agent:joined', () => setAgentActive(true));
      setSocket(s);
    });
  };

  const requestAgent = async () => {
    if (!user) {
      setMessages((prev) => [...prev, { id: Date.now(), text: 'Please sign in first to talk to a crew member. Click profile icon above!', sender: 'bot' }]);
      return;
    }
    setTyping(true);
    try {
      const { data } = await api.post('/chats');
      setChatId(data._id);
      setMessages((prev) => [...prev, { id: Date.now(), text: 'Connecting you to a crew member...', sender: 'bot' }]);
      setTimeout(() => {
        setMessages((prev) => [...prev, { id: Date.now() + 1, text: 'You\'re now chatting with a real person! They\'ll respond shortly. ⚓', sender: 'agent' }]);
        setAgentActive(true);
        setTyping(false);
      }, 1000);
    } catch {
      setMessages((prev) => [...prev, { id: Date.now(), text: 'Something went wrong. Try again later.', sender: 'bot' }]);
      setTyping(false);
    }
  };

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg || typing) return;
    setInput('');
    setMessages((m) => [...m, { id: Date.now(), text: msg, sender: 'user' }]);
    if (agentActive && chatId && socket) {
      socket.emit('message:send', { chatId, text: msg, sender: 'user' });
    } else {
      setTyping(true);
      setTimeout(() => {
        const answer = findAnswer(msg);
        if (answer === 'AGENT_REQUEST') {
          requestAgent();
        } else {
          setMessages((m) => [...m, { id: Date.now() + 1, text: answer, sender: 'bot' }]);
          setTyping(false);
        }
      }, 500 + Math.random() * 400);
    }
  };

  const quickReplies = agentActive
    ? []
    : ['Shipping info', 'Return policy', 'Sizing help', 'Talk to Agent'];

  return (
    <>
      <div className={`chatbot-toggle ${open ? 'active' : ''}`} onClick={() => setOpen(!open)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpen(!open)} aria-label="Chat">
        {!open && <div className="chatbot-speech-bubble">Need help? <span className="chatbot-speech-tail" /></div>}
        <div className="chatbot-mascot">
          <svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg" className="chatbot-mascot-svg">
            <defs>
              <radialGradient id="eyeGrad" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#2a1a3a" />
                <stop offset="100%" stopColor="#0d0d1a" />
              </radialGradient>
            </defs>
            {/* Body */}
            <rect x="42" y="88" width="36" height="30" rx="12" className="mascot-body" />
            <path d="M38 94 L50 88 L70 88 L82 94 L76 118 L60 112 L44 118 Z" className="mascot-coat" />
            {/* Head */}
            <circle cx="60" cy="54" r="34" className="mascot-head" />
            {/* Hair fringe */}
            <path d="M30 48 Q40 28 60 22 Q80 28 90 48" className="mascot-hair" fill="none" strokeWidth="3" strokeLinecap="round" />
            <path d="M35 42 Q45 25 60 20 Q75 25 85 42" className="mascot-hair" fill="none" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
            {/* Hat */}
            <path d="M22 38 Q60 10 98 38 Q92 30 78 28 Q60 32 42 28 Q28 30 22 38 Z" className="mascot-hat-top" />
            <ellipse cx="60" cy="38" rx="40" ry="5" className="mascot-hat-band" />
            <circle cx="86" cy="28" r="5.5" className="mascot-hat-skull" />
            <circle cx="87" cy="28" r="2.5" className="mascot-hat-skull-inner" />
            {/* Eyes - huge sparkly */}
            <ellipse cx="43" cy="50" rx="10" ry="12" className="mascot-eye" />
            <ellipse cx="77" cy="50" rx="10" ry="12" className="mascot-eye" />
            <ellipse cx="43" cy="50" rx="6" ry="8" fill="url(#eyeGrad)" />
            <ellipse cx="77" cy="50" rx="6" ry="8" fill="url(#eyeGrad)" />
            {/* Primary catchlights */}
            <circle cx="39" cy="45" r="4" className="mascot-catchlight" />
            <circle cx="73" cy="45" r="4" className="mascot-catchlight" />
            {/* Secondary catchlights */}
            <circle cx="46" cy="54" r="2" className="mascot-catchlight" />
            <circle cx="80" cy="54" r="2" className="mascot-catchlight" />
            {/* Star catchlights */}
            <path d="M39 48 h2 l-1.6 1.2 l0.6 -2 l0.6 2 Z" className="mascot-catchlight-star" />
            <path d="M73 48 h2 l-1.6 1.2 l0.6 -2 l0.6 2 Z" className="mascot-catchlight-star" />
            {/* Blush */}
            <ellipse cx="30" cy="62" rx="7" ry="4" className="mascot-blush" opacity="0.35" />
            <ellipse cx="90" cy="62" rx="7" ry="4" className="mascot-blush" opacity="0.35" />
            {/* Mouth - tiny cute "w" */}
            <path d="M55 66 q2 3 5 0 q3 3 5 0" className="mascot-mouth" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            {/* Nose - tiny dot */}
            <circle cx="60" cy="59" r="1.5" className="mascot-nose" opacity="0.5" />
            {/* Collar */}
            <path d="M46 84 L60 92 L74 84 L60 98 Z" className="mascot-collar" />
            <circle cx="60" cy="96" r="3.5" className="mascot-collar-knot" />
            {/* Left arm */}
            <rect x="24" y="94" width="18" height="8" rx="4" className="mascot-arm" />
            <circle cx="24" cy="98" r="5.5" className="mascot-hand" />
            {/* Right arm waving */}
            <g className="mascot-wave-group">
              <rect x="78" y="88" width="18" height="8" rx="4" className="mascot-arm" />
              <circle cx="96" cy="86" r="5.5" className="mascot-hand" />
            </g>
          </svg>
        </div>
      </div>

      <div className={`chatbot-panel ${open ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <span className="chatbot-avatar">{agentActive ? '👤' : '☠'}</span>
            <div>
              <p className="chatbot-name">{agentActive ? 'Crew Member' : 'Lupe & Luxe'}</p>
              <p className="chatbot-status">{agentActive ? '🟢 Online' : '🤖 Auto assistant'}</p>
            </div>
          </div>
          <button className="chatbot-close" onClick={() => setOpen(false)} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((m) => (
            <div key={m.id} className={`chatbot-msg ${m.sender === 'user' ? 'user' : m.sender === 'agent' ? 'agent' : 'bot'}`}>
              <div className="chatbot-bubble">{m.text}</div>
            </div>
          ))}
          {typing && (
            <div className="chatbot-msg bot">
              <div className="chatbot-bubble typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {quickReplies.length > 0 && messages.length < 4 && (
          <div className="chatbot-quick">
            {quickReplies.map((qr, i) => (
              <button key={i} className="chatbot-quick-btn" onClick={() => handleSend(qr)}>
                {qr}
              </button>
            ))}
          </div>
        )}

        {agentActive && (
          <div className="chatbot-agent-banner">You're chatting with a real crew member</div>
        )}

        <div className="chatbot-input-wrap">
          <input
            ref={inputRef}
            type="text"
            className="chatbot-input"
            placeholder={agentActive ? 'Type a message...' : 'Ask me anything...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="chatbot-send" onClick={() => handleSend()} disabled={!input.trim() || typing} aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/></svg>
          </button>
        </div>
      </div>
    </>
  );
}
