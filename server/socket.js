const Chat = require('./models/Chat');

function setupSocket(io) {
  io.on('connection', (socket) => {
    socket.data.connected = true;
    io.emit('user:connected', { socketId: socket.id });

    socket.on('chat:join', ({ chatId }) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on('chat:leave', ({ chatId }) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on('message:send', async ({ chatId, text, sender }, callback) => {
      try {
        if (!socket.rooms.has(`chat:${chatId}`)) {
          if (callback) callback({ error: 'Not authorized' });
          return;
        }
        const chat = await Chat.findById(chatId);
        if (!chat) {
          if (callback) callback({ error: 'Chat not found' });
          return;
        }
        chat.messages.push({ sender, text, timestamp: new Date() });
        if (sender === 'user') chat.unreadAgent += 1;
        else chat.unreadUser += 1;
        chat.status = 'active';
        await chat.save();

        const msg = chat.messages[chat.messages.length - 1];
        io.to(`chat:${chatId}`).emit('message:new', msg);

        if (callback) callback({ ok: true });
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    socket.on('chat:assign', async ({ chatId }) => {
      io.to(`chat:${chatId}`).emit('agent:joined');
    });

    socket.on('typing:start', ({ chatId, sender }) => {
      socket.to(`chat:${chatId}`).emit('typing:display', { sender, typing: true });
    });

    socket.on('typing:stop', ({ chatId, sender }) => {
      socket.to(`chat:${chatId}`).emit('typing:display', { sender, typing: false });
    });

    socket.on('room:join', (room) => {
      socket.join(room);
    });

    socket.on('employee:register', ({ employeeId }) => {
      socket.data.employeeId = employeeId;
      socket.join(`employee:${employeeId}`);
    });

    socket.on('order:new', ({ order, employeeIds }) => {
      if (employeeIds && Array.isArray(employeeIds)) {
        employeeIds.forEach(id => {
          io.to(`employee:${id}`).emit('order:notification', { type: 'order:new', order });
        });
      }
      io.to('admin').emit('order:notification', { type: 'order:new', order });
    });

    socket.on('order:status:change', ({ order, oldStatus, newStatus, employeeIds }) => {
      if (employeeIds && Array.isArray(employeeIds)) {
        employeeIds.forEach(id => {
          io.to(`employee:${id}`).emit('order:notification', { type: 'order:status:change', order, oldStatus, newStatus });
        });
      }
      io.to('admin').emit('order:notification', { type: 'order:status:change', order, oldStatus, newStatus });
    });
  });
}

module.exports = setupSocket;
