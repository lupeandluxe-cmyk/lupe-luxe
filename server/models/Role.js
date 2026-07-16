const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  module: { type: String, required: true },
  actions: [{ type: String }],
});

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String },
  isSystem: { type: Boolean, default: false },
  permissions: [permissionSchema],
  priority: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
