const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String },
  filename: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number },
  folder: { type: String, default: 'general' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Media', mediaSchema);
