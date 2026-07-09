const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, default: '' },
  metaTitle: { type: String },
  metaDescription: { type: String },
  published: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Page', pageSchema);
