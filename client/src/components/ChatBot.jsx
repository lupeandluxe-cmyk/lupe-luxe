import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const FAQ = [
  { q: ['kya haal', 'kaise ho', 'kaisa hai', 'theek hu', 'main theek', 'sab theek', 'acha', 'badhiya', 'sahi hai', 'kya scene', 'kya chal raha', 'whats up', "what's up", 'sup', "how's it going", 'yo', 'hello', 'hi ', ' hey', 'hii', 'helloo', 'helo', 'hiiii', 'helooo', 'good morning', 'good evening', 'good night', 'namaste', 'namaskar', 'adaab'], a: 'Sab badhiya hai! ⚓ Welcome to Lupe & Luxe. Main aapki kya help kar sakta hun? Orders, shipping, sizing — kuch bhi poochho!' },
  { q: ['kya bol', 'kaun ho', 'tumhara naam', 'naam kya', 'who are you', 'what are you', 'tum kaun', 'tu kaun'], a: 'Main Lupe & Luxe ka assistant hun! 🤖 Aapke orders, shipping, sizing, payments — sabke baare mein madad kar sakta hun. Batao kya chahiye?' },
  { q: ['accha', 'theek hai', 'ok', 'okay', 'alright', 'nice', 'cool', 'awesome', 'great', 'perfect', 'lit', 'fire', 'amazing', 'love it', 'awesome hai', 'badiya'], a: 'Glad you like it! ⚓ Kuch aur poochna hai? Main yahan hun!' },
  { q: ['bhai', 'yaar', 'dost', 'bro', 'dude', 'fam', 'boss', 'anna', 'bhaiya'], a: 'Haan bhai, batao kya help chahiye! ⚓ Lupe & Luxe mein aapka swagat hai!' },
  { q: ['shipping', 'delivery', 'kab milega', 'kab aayega', 'deliver kab', 'shipping time', 'kitne din', 'kitne din mein', 'delivery time', 'ship', 'arrive', 'package'], a: 'Orders 1-2 business days mein process hote hain. Domestic shipping 3-7 days, international 7-14 days. Tracking link mil jayega shipped hone pe! 📦' },
  { q: ['return', 'refund', 'exchange', 'cancel', 'wapas karna', 'return karna', 'badalna', 'paisa wapas', 'money back', 'replacement'], a: 'Delivery ke 7 din andar return kar sakte ho. Items unworn aur tags attached hone chahiye. Custom pieces final sale hain. Profile page se initiate karo! 🔄' },
  { q: ['size', 'fit', 'measurement', 'sizing chart', 'size kaise', 'kaunsa size', 'kaise size', 'kitna bada', 'kitna chhota', 'loose', 'tight', 'oversized'], a: 'Har product page pe size options hain. Doubt ho toh ek size up lo oversized fit ke liye. Premium pieces pe custom sizing bhi available hai! 📏' },
  { q: ['payment', 'pay', 'razorpay', 'upi', 'cod', 'paisa', 'kitna price', 'price kitna', 'kitne ka', 'mehnga', 'sasta', 'cost', 'rate'], a: 'Razorpay (cards, UPI, net banking), UPI QR (GPay/PhonePe/PayTM), aur Cash on Delivery accept karte hain. Sab secure hai! 💳' },
  { q: ['price', 'kitna', 'rate', 'cost', 'mehnga', 'sasta', 'cheap', 'affordable', 'budget'], a: 'Hamare pieces premium quality ke hain aur prices justified hain. Har product page pe price dikha hai. Limited Drops zyada exclusive hain! 💰' },
  { q: ['order', 'track', 'status', 'where is my', 'mera order', 'order kahan', 'tracking', 'order status'], a: 'Profile page pe order status check karo — real-time updates milenge payment verification aur shipping ke baare mein! 📍' },
  { q: ['contact', 'support', 'help', 'email', 'phone', 'baat karni', 'sunao', 'sun', 'bolo'], a: 'Email karo lupeandluxe@gmail.com pe — 24 hours mein reply mil jayega. Urgent ho toh Instagram pe DM karo! 📧' },
  { q: ['product', 'custom', 'design', 'customize', 'banwana', 'design karna', 'apna design', 'custom piece'], a: 'Haan! Custom designs available hain. Custom Tees category browse karo ya apna design idea bhejo — unique piece bana denge! 🎨' },
  { q: ['discount', 'coupon', 'promo', 'offer', 'sale', 'sasta', 'bachat', 'kam price', 'deal'], a: 'Checkout pe coupon codes lagao. Instagram pe follow karo exclusive drops ke liye. New crew members ko welcome discount milta hai! 🏷️' },
  { q: ['premium', 'featured', 'limited', 'drop', 'exclusive', 'khaas', 'special', 'rare'], a: ' Limited Drops hamare sabse exclusive pieces hain — har ek numbered aur small batches mein release hota hai. Limited Drops category mein dekho! 💎' },
  { q: ['kya kar rahe', 'kya scene', 'kya baat', 'kya hua', 'kya masla', 'kya problem', 'everything ok', 'sab thik', 'sab changa'], a: 'Sab changa hai! ⚓ Lupe & Luxe chal raha hai full josh mein. Aapki kya help kar sakta hun?' },
  { q: ['thank', 'shukriya', 'dhanyavaad', 'thanks', 'ty', 'thank you', 'thanku'], a: 'Arey! Kab ka thank you! ⚓ Kuch aur poochna hai toh batao!' },
  { q: ['bye', 'alvida', 'chalta hun', 'ja raha', 'ja rahi', 'see you', 'goodbye', 'tata', 'phir milenge'], a: 'Bye bye! ⚓ Lupe & Luxe mein aapka swagat hai. Kabhi bhi aana!' },
  { q: ['kya dikha', 'show me', 'kuch dikha', 'products dikhao', 'designs dikhao', 'browse', 'dekhna hai'], a: 'Products browse karo! 🛍️ Home page pe sab categories hain — Custom Tees, Hoodies, Limited Drops, aur bahut kuch!' },
  { q: ['kya chal raha', 'new arrivals', 'naya kya', 'latest', 'fresh', 'new drop', 'abhi kya'], a: 'Fresh drops aa rahe hain! 🔥 Home page pe "Just Arrived" section dekho ya Products page pe naye pieces dekho!' },
  { q: ['mujhe chahiye', 'mujhe lena', 'kharidna', 'buy karna', 'purchase', 'kharid', 'lenge'], a: 'Bas product select karo aur cart mein daal do! 💳 Checkout pe payment options mil jayenge — UPI, cards, COD sab available hai!' },
  { q: ['kya milta', 'benefit', 'fayda', 'why lupe', 'kyu lupe', 'why you'], a: 'Lupe & Luxe — premium thrift aur custom clothing! Sustainable fashion, unique designs, aur Grand Line vibes. Har piece khaas hai! ⚓' },
  { q: ['instagram', 'social', 'follow', 'insta'], a: 'Instagram pe follow karo @LupeAndLuxe — naye drops, behind-the-scenes, aur exclusive offers wahan milte hain! 📸' },
  { q: ['kya bolte', 'bol', 'speak', 'hindi', 'english', 'hinglish', 'mixed'], a: 'Main Hindi aur English dono samajhta hun! 🤗 Jo bhi comfortable ho, woh likho — main help karunga!' },
  { q: ['human', 'agent', 'real person', 'talk to', 'support', 'insaan', 'aadmi', 'person'], a: 'AGENT_REQUEST' },
  { q: ['review', 'reviews', 'rating', 'star', 'feedback', 'review dena', 'review karna'], a: 'Aap review de sakte ho! ⚓ Hamari website pe "Reviews" section hai — wahan jaakar apna experience share karo. Aapki rai hamare liye important hai!' },
  { q: ['review kaise', 'how to review', 'review kahan', 'kahan review'], a: 'Home page pe "Voices of the Crew" section mein jaakar apna review de sakte ho! Ya "Write a Review" button pe click karo. 📝' },
];

function findAnswer(input) {
  const text = input.toLowerCase().trim();
  if (!text) return 'Batao kya help chahiye! ⚓';
  for (const item of FAQ) {
    for (const kw of item.q) {
      if (text.includes(kw)) {
        if (item.a === 'AGENT_REQUEST') return 'AGENT_REQUEST';
        return item.a;
      }
    }
  }
  return 'Samajh nahi aaya! 🤔 Thoda aur clearly batao? Main orders, shipping, sizing, payments, reviews — sabke baare mein madad kar sakta hun. Ya "Talk to Agent" se real person se baat karo!';
}

export default function ChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 0, text: 'Ahoy Captain! ⚓ Lupe & Luxe mein swagat hai! Kuch bhi poochho — orders, shipping, sizing, reviews — main help karunga!', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [agentActive, setAgentActive] = useState(false);
  const [socket, setSocket] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef([]);

  useEffect(() => {
    return () => { timerRef.current.forEach(clearTimeout); timerRef.current = []; };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || !chatId) return;
    let ws;
    try {
      ws = new WebSocket(`${window.location.origin}/ws/chat/${chatId}`);
      ws.onopen = () => setAgentActive(true);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'message:new' && data.payload && data.payload.sender !== 'user') {
            setMessages((prev) => [...prev, { id: Date.now(), text: data.payload.text, sender: 'agent' }]);
          }
        } catch { /* ignore malformed frames */ }
      };
      ws.onerror = () => { /* server offline — chat still works via bot + REST */ };
      setSocket(ws);
    } catch {
      setSocket(null);
    }
    return () => { try { ws?.close(); } catch { /* ignore */ } };
  }, [chatId, open]);

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
      const tid = setTimeout(() => {
        setMessages((prev) => [...prev, { id: Date.now() + 1, text: 'You\'re now chatting with a real person! They\'ll respond shortly. ⚓', sender: 'agent' }]);
        setAgentActive(true);
        setTyping(false);
      }, 1000);
      timerRef.current.push(tid);
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
    if (agentActive && chatId && socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ chatId, event: 'message:send', text: msg, sender: 'user' }));
    } else {
      setTyping(true);
      const tid = setTimeout(() => {
        const answer = findAnswer(msg);
        if (answer === 'AGENT_REQUEST') {
          requestAgent();
        } else {
          setMessages((m) => [...m, { id: Date.now() + 1, text: answer, sender: 'bot' }]);
          setTyping(false);
        }
      }, 500 + Math.random() * 400);
      timerRef.current.push(tid);
    }
  };

  const quickReplies = agentActive
    ? []
    : ['Shipping info', 'Size help', 'Write a Review', 'Talk to Agent'];

  return (
    <>
      <div className={`chatbot-toggle ${open ? 'active' : ''}`} onClick={() => setOpen(!open)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpen(!open)} aria-label="Chat">
        {!open && <div className="chatbot-mascot">
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
        </div>}
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
