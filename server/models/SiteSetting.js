const mongoose = require('mongoose');

const siteSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
  type: { type: String, enum: ['text', 'image', 'color', 'boolean', 'number', 'json'], default: 'text' },
}, { timestamps: true });

module.exports = mongoose.model('SiteSetting', siteSettingSchema);
