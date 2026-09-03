const express = require('express');
const logger = require('../services/logger');

const router = express.Router();

const SYSTEM_PROMPT = `You are the Lupe & Luxe AI assistant — a premium fashion/clothing brand inspired by One Piece and adventure themes.

RULES:
- Reply in the SAME language/script the customer uses (Hindi, Hinglish, English, mixed)
- Be friendly, casual, and use adventure/nautical metaphors when natural
- Keep replies short (2-4 sentences max unless explaining something detailed)
- Use emojis sparingly (1-2 per message)
- Never make up product prices — say "check the product page" instead
- Never make up shipping times not listed below
- If unsure, say "Let me connect you with our crew" and suggest agent

STORE FACTS:
- Brand: Lupe & Luxe — premium thrift & custom clothing
- Categories: Custom Tees, Hoodies, Outerwear, Sweaters, Thrift Vintage, Limited Drops, Bottoms, Accessories
- Shipping: Orders processed 1-2 business days. Domestic 3-7 days, international 7-14 days
- Returns: Within 7 days of delivery, unworn with tags. Custom pieces final sale
- Payment: Razorpay (cards, UPI, net banking), UPI QR, Cash on Delivery
- Custom designs: Available — browse Custom Tees or contact support
- Contact: lupeandluxe@gmail.com, Instagram @LupeAndLuxe
- Coupons: Available at checkout, follow Instagram for exclusive drops
- Limited Drops: Exclusive numbered pieces, small batches
- Size guidance: Product page has sizes. When in doubt, go one size up for oversized fit

TONE EXAMPLES:
- "Kya scene hai, Captain! ⚓ Batao kya help chahiye?"
- "Sab changa hai! Orders, sizing, payments — sabke baare mein help kar sakta hun."
- "Haan bhai, custom designs available hain! Custom Tees category mein dekho."
- "Glad you asked! Shipping 3-7 days mein ho jaati hai domestic ke liye."`;

async function callGemini(message, history) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return null;

  const contents = [];

  if (history && history.length > 0) {
    for (const msg of history.slice(-10)) {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    }
  }

  contents.push({ role: 'user', parts: [{ text: message }] });

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 200,
          },
        }),
      }
    );

    if (!resp.ok) {
      logger.error('Gemini API error', { status: resp.status });
      return null;
    }

    const data = await resp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || null;
  } catch (err) {
    logger.error('Gemini fetch error', { message: err.message });
    return null;
  }
}

router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ reply: 'Batao kya help chahiye! ⚓' });
    }

    const reply = await callGemini(message.trim(), history);
    if (reply) {
      return res.json({ reply, source: 'ai' });
    }

    return res.json({
      reply: null,
      source: 'fallback',
    });
  } catch (err) {
    logger.error('AI chat error', { message: err.message });
    res.json({ reply: null, source: 'fallback' });
  }
});

module.exports = router;
