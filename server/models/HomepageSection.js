const mongoose = require('mongoose');

const homepageSectionSchema = new mongoose.Schema({
  section: { type: String, required: true },
  type: { type: String, enum: ['hero', 'banner', 'featured', 'collection', 'testimonial', 'promo', 'newsletter', 'announcement'], required: true },
  title: { type: String },
  subtitle: { type: String },
  text: { type: String },
  image: { type: String },
  video: { type: String },
  buttonText: { type: String },
  buttonLink: { type: String },
  images: [{ type: String }],
  items: [{ type: mongoose.Schema.Types.Mixed }],
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('HomepageSection', homepageSectionSchema);
