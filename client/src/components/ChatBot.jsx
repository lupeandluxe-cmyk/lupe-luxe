import { useState, useRef, useEffect } from 'react';

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
];

function findAnswer(input) {
  const text = input.toLowerCase().trim();
  if (!text) return FAQ[FAQ.length - 1].a;
  let best = { score: 0, answer: FAQ[FAQ.length - 1].a };
  for (const item of FAQ) {
    let score = 0;
    for (const kw of item.q) {
      if (text.includes(kw)) score++;
    }
    if (score > best.score) {
      best = { score, answer: item.a };
    }
  }
  return best.answer;
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 0, text: 'Ahoy Captain! ⚓ Ask me anything about Lupe & Luxe.', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSend = (text) => {
    const msg = (text || input).trim();
    if (!msg || typing) return;
    setInput('');
    setMessages(m => [...m, { id: Date.now(), text: msg, sender: 'user' }]);
    setTyping(true);
    setTimeout(() => {
      setMessages(m => [...m, { id: Date.now() + 1, text: findAnswer(msg), sender: 'bot' }]);
      setTyping(false);
    }, 600 + Math.random() * 400);
  };

  const quickReplies = ['Shipping info', 'Return policy', 'Sizing help', 'Payment options'];

  return (
    <>
      <button className={`chatbot-toggle ${open ? 'active' : ''}`} onClick={() => setOpen(!open)} aria-label="Chat">
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        )}
      </button>

      <div className={`chatbot-panel ${open ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <span className="chatbot-avatar">☠</span>
            <div>
              <p className="chatbot-name">Lupe & Luxe</p>
              <p className="chatbot-status">Online • Ready to help</p>
            </div>
          </div>
          <button className="chatbot-close" onClick={() => setOpen(false)} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map(m => (
            <div key={m.id} className={`chatbot-msg ${m.sender === 'user' ? 'user' : 'bot'}`}>
              <div className="chatbot-bubble">{m.text}</div>
            </div>
          ))}
          {typing && (
            <div className="chatbot-msg bot">
              <div className="chatbot-bubble typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length < 3 && (
          <div className="chatbot-quick">
            {quickReplies.map((qr, i) => (
              <button key={i} className="chatbot-quick-btn" onClick={() => handleSend(qr)}>
                {qr}
              </button>
            ))}
          </div>
        )}

        <div className="chatbot-input-wrap">
          <input
            ref={inputRef}
            type="text"
            className="chatbot-input"
            placeholder="Type your question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button className="chatbot-send" onClick={() => handleSend()} disabled={!input.trim() || typing} aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/></svg>
          </button>
        </div>
      </div>
    </>
  );
}
