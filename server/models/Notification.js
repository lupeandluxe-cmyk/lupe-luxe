const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  type: { type: String, enum: ['order', 'chat', 'task', 'system', 'employee', 'announcement'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  data: { type: mongoose.Schema.Types.Mixed },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  broadcastTo: { type: String, enum: ['all', 'department', 'role', 'employee'] },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

async function createNotification({ recipient, department, type, title, message, link, data, priority, broadcastTo }) {
  return Notification.create({ recipient, department, type, title, message, link, data, priority, broadcastTo });
}

module.exports = Notification;
module.exports.createNotification = createNotification;
