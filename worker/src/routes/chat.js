import { Hono } from 'hono';
import { find, findOne, insertOne, updateOne } from '../lib/db.js';
import { protect, adminOnly } from '../lib/middleware.js';
import { sanitizeBody } from '../lib/sanitize.js';

const app = new Hono();

app.post('/', protect, async (c) => {
  try {
    const user = c.get('user');
    const existing = await findOne('chats', { user: user._id, status: 'active' });
    if (existing) return c.json(existing);
    const id = await insertOne('chats', {
      user: user._id,
      guestName: null,
      guestEmail: null,
      status: 'active',
      messages: [{ sender: 'agent', text: 'Ahoy Captain! A real crew member will be with you shortly. ⚓', timestamp: new Date() }],
      assignedTo: null,
      unreadUser: 0,
      unreadAgent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const chat = await findOne('chats', { _id: id });
    return c.json(chat, 201);
  } catch (err) {
    return c.json({ message: 'Chat creation failed' }, 500);
  }
});

app.get('/', protect, adminOnly, async (c) => {
  try {
    const chats = await find('chats', { sort: { updatedAt: -1 } });
    return c.json(chats);
  } catch (err) {
    return c.json({ message: 'Failed to fetch chats' }, 500);
  }
});

app.get('/mine', protect, async (c) => {
  try {
    const user = c.get('user');
    const chat = await findOne('chats', { user: user._id }, {}, { sort: { createdAt: -1 } });
    return c.json(chat);
  } catch (err) {
    return c.json({ message: 'Failed to fetch chat' }, 500);
  }
});

app.get('/:id', protect, async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const chat = await findOne('chats', { _id: id });
    if (!chat) return c.json({ message: 'Chat not found' }, 404);
    if (!(user.isAdmin || ['super_admin', 'admin'].includes(user.role)) && String(chat.user) !== String(user._id)) {
      return c.json({ message: 'Not authorized' }, 403);
    }
    return c.json(chat);
  } catch (err) {
    return c.json({ message: 'Failed to fetch chat' }, 500);
  }
});

app.put('/:id/assign', protect, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    await updateOne('chats', { _id: id }, { $set: { assignedTo: user._id, updatedAt: new Date() } });
    const chat = await findOne('chats', { _id: id });
    return c.json(chat);
  } catch (err) {
    return c.json({ message: 'Assignment failed' }, 500);
  }
});

app.put('/:id/close', protect, async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const chat = await findOne('chats', { _id: id });
    if (!chat) return c.json({ message: 'Chat not found' }, 404);
    if (!(user.isAdmin || ['super_admin', 'admin'].includes(user.role)) && String(chat.user) !== String(user._id)) {
      return c.json({ message: 'Not authorized' }, 403);
    }
    await updateOne('chats', { _id: id }, { $set: { status: 'closed', updatedAt: new Date() } });
    const updated = await findOne('chats', { _id: id });
    return c.json(updated);
  } catch (err) {
    return c.json({ message: 'Failed to close chat' }, 500);
  }
});

app.get('/:id/messages', protect, async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const chat = await findOne('chats', { _id: id });
    if (!chat) return c.json({ message: 'Chat not found' }, 404);
    if (!(user.isAdmin || ['super_admin', 'admin'].includes(user.role)) && String(chat.user) !== String(user._id)) {
      return c.json({ message: 'Not authorized' }, 403);
    }
    const page = parseInt(c.req.query('page')) || 1;
    const limit = parseInt(c.req.query('limit')) || 50;
    const startIdx = (page - 1) * limit;
    const messages = (chat.messages || []).slice(startIdx, startIdx + limit);
    return c.json({ messages, total: (chat.messages || []).length, page, totalPages: Math.ceil((chat.messages || []).length / limit) });
  } catch (err) {
    return c.json({ message: 'Failed to fetch messages' }, 500);
  }
});

// Send a message via REST (also used by the WebSocket relay).
app.post('/:id/messages', protect, async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const body = sanitizeBody(await c.req.json().catch(() => ({})));
    const { text, sender } = body;
    if (!text || !String(text).trim()) return c.json({ message: 'Message text is required' }, 400);
    const chat = await findOne('chats', { _id: id });
    if (!chat) return c.json({ message: 'Chat not found' }, 404);
    if (!(user.isAdmin || ['super_admin', 'admin'].includes(user.role)) && String(chat.user) !== String(user._id)) {
      return c.json({ message: 'Not authorized' }, 403);
    }
    const role = sender === 'agent' || (user.isAdmin || ['super_admin', 'admin'].includes(user.role)) ? 'agent' : 'user';
    const msg = { sender: role, text: String(text).trim(), timestamp: new Date() };
    const unread = role === 'user' ? { $inc: { unreadAgent: 1 } } : { $inc: { unreadUser: 1 } };
    await updateOne('chats', { _id: id }, {
      $push: { messages: msg },
      ...unread,
      $set: { status: 'active', updatedAt: new Date() },
    });
    return c.json(msg, 201);
  } catch (err) {
    console.error('[CHAT] send message error:', err.message);
    return c.json({ message: 'Failed to send message' }, 500);
  }
});

export default app;