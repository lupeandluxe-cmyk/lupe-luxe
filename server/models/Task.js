const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'cancelled', 'needs_help'], default: 'pending' },
  deadline: { type: Date },
  completedAt: { type: Date },
  proof: [{
    url: String,
    description: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  notes: [{ text: String, by: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, createdAt: { type: Date, default: Date.now } }],
  relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
