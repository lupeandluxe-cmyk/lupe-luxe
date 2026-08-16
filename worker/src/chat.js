// ChatRoom Durable Object — realtime chat over WebSocket (replaces Socket.io).
// Clients connect to /ws/chat/:chatId?token=<jwt>. Messages are persisted via
// the REST API (POST /api/chats/:id/messages) and relayed through this DO.

import { setEnv, findOne, updateOne } from './lib/db.js';

export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const isUpgrade = request.headers.get('Upgrade')?.toLowerCase() === 'websocket';
    if (!isUpgrade) return new Response('Expected WebSocket upgrade', { status: 400 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const chatId = url.pathname.split('/').pop();
    server.accept();

    this.state.acceptWebSocket(server, [chatId]);

    // Notify existing peers a user joined
    this.broadcast(chatId, { type: 'presence', payload: 'joined' }, server);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    let data;
    try { data = JSON.parse(message); } catch { return; }
    const { chatId, event, text, sender } = data || {};
    if (!chatId) return;

    if (event === 'message:send' && text) {
      try {
        const msg = { sender: sender === 'agent' ? 'agent' : 'user', text: String(text).slice(0, 2000), timestamp: new Date() };
        const chat = await findOne('chats', { _id: chatId });
        if (chat) {
          const unread = msg.sender === 'user' ? { $inc: { unreadAgent: 1 } } : { $inc: { unreadUser: 1 } };
          await updateOne('chats', { _id: chatId }, {
            $push: { messages: msg },
            ...unread,
            $set: { status: 'active', updatedAt: new Date() },
          });
        }
        this.broadcast(chatId, { type: 'message:new', payload: msg });
      } catch (err) {
        console.error('[CHAT DO] persist error:', err.message);
      }
    } else if (event === 'typing:start' || event === 'typing:stop') {
      this.broadcast(chatId, { type: 'typing:display', payload: { sender, typing: event === 'typing:start' } });
    }
  }

  async webSocketClose(ws, code, reason) {
    ws.close(code, reason);
  }

  broadcast(chatId, payload, exceptWs) {
    for (const ws of this.state.getWebSockets(chatId)) {
      if (ws === exceptWs) continue;
      try { ws.send(JSON.stringify(payload)); } catch { /* ignore */ }
    }
  }
}