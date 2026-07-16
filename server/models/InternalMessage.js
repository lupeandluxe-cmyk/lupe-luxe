const mongoose = require('mongoose');

const internalMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  type: { type: String, enum: ['private', 'group', 'broadcast', 'announcement'], default: 'private' },
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  text: { type: String },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
  }],
  readBy: [{
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    readAt: { type: Date, default: Date.now },
  }],
  pinned: { type: Boolean, default: false },
  parentMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'InternalMessage' },
}, { timestamps: true });

module.exports = mongoose.model('InternalMessage', internalMessageSchema);
