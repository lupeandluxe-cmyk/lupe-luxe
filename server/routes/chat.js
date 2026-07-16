const express = require('express');
const Chat = require('../models/Chat');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const existing = await Chat.findOne({ user: req.user._id, status: 'active' });
    if (existing) return res.json(existing);
    const chat = await Chat.create({ user: req.user._id, messages: [{ sender: 'agent', text: 'Ahoy Captain! A real crew member will be with you shortly. ⚓' }] });
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Chat creation failed' });
  }
});

router.get('/', protect, admin, async (req, res) => {
  try {
    const chats = await Chat.find().populate('user', 'name email').populate('assignedTo', 'name').sort('-updatedAt');
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch chats' });
  }
});

router.get('/mine', protect, async (req, res) => {
  try {
    const chat = await Chat.findOne({ user: req.user._id }).sort('-createdAt');
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch chat' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id).populate('user', 'name email').populate('assignedTo', 'name');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!req.user.isAdmin && chat.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch chat' });
  }
});

router.put('/:id/assign', protect, admin, async (req, res) => {
  try {
    const chat = await Chat.findByIdAndUpdate(req.params.id, { assignedTo: req.user._id }, { new: true });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Assignment failed' });
  }
});

router.put('/:id/close', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!req.user.isAdmin && chat.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    chat.status = 'closed';
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Failed to close chat' });
  }
});

router.get('/:id/messages', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!req.user.isAdmin && chat.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const startIdx = (page - 1) * limit;
    const messages = chat.messages.slice(startIdx, startIdx + limit);
    res.json({ messages, total: chat.messages.length, page, totalPages: Math.ceil(chat.messages.length / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

module.exports = router;
