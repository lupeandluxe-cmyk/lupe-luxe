const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  action: { type: String, required: true },
  module: { type: String, required: true },
  description: { type: String },
  targetId: { type: String },
  targetType: { type: String },
  ip: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
}, { timestamps: true });

activityLogSchema.index({ employee: 1, createdAt: -1 });
activityLogSchema.index({ module: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
