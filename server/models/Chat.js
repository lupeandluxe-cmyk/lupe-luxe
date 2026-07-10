const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'agent'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestName: { type: String },
  guestEmail: { type: String },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  messages: [messageSchema],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  unreadUser: { type: Number, default: 0 },
  unreadAgent: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
