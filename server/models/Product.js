const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  salePrice: { type: Number },
  images: [{ type: String }],
  category: { type: String, required: true },
  tags: [{ type: String }],
  size: [{ type: String }],
  countInStock: { type: Number, required: true, default: 0 },
  sku: { type: String },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  bestSeller: { type: Boolean, default: false },
  visible: { type: Boolean, default: true },
}, { timestamps: true });

// slug is already defined as unique: true above
module.exports = mongoose.model('Product', productSchema);
