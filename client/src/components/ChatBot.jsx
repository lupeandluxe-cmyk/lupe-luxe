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
          <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="chatbot-mascot-svg">
            {/* Hat */}
            <rect x="32" y="18" width="56" height="8" rx="3" className="mascot-hat-band" />
            <path d="M30 26 L60 8 L90 26 Z" className="mascot-hat-top" />
            <circle cx="72" cy="24" r="4" className="mascot-hat-skull" />
            {/* Head */}
            <circle cx="60" cy="58" r="30" className="mascot-head" />
            {/* Eyes */}
            <ellipse cx="46" cy="52" rx="5" ry="6" className="mascot-eye" />
            <ellipse cx="74" cy="52" rx="5" ry="6" className="mascot-eye" />
            <circle cx="46" cy="52" r="2.5" className="mascot-pupil" />
            <circle cx="74" cy="52" r="2.5" className="mascot-pupil" />
            {/* Blush */}
            <ellipse cx="38" cy="62" rx="5" ry="3" className="mascot-blush" opacity="0.4" />
            <ellipse cx="82" cy="62" rx="5" ry="3" className="mascot-blush" opacity="0.4" />
            {/* Smile */}
            <path d="M48 67 Q60 76 72 67" className="mascot-smile" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Body */}
            <rect x="44" y="86" width="32" height="22" rx="8" className="mascot-body" />
            {/* Collar */}
            <path d="M44 94 L52 88 L60 94 L68 88 L76 94" className="mascot-collar" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Arms */}
            <rect x="28" y="92" width="16" height="8" rx="5" className="mascot-arm" />
            <rect x="76" y="92" width="16" height="8" rx="5" className="mascot-arm" />
            {/* Wave hand */}
            <rect x="90" y="88" width="10" height="10" rx="5" className="mascot-hand mascot-wave" />
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
