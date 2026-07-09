require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const SiteSetting = require('./models/SiteSetting');
const HomepageSection = require('./models/HomepageSection');
const Category = require('./models/Category');
const Page = require('./models/Page');

const defaultSettings = [
  { key: 'siteName', value: 'Lupe & Luxe', type: 'text' },
  { key: 'siteDescription', value: 'Premium Thrift & Custom Clothing — Inspired by the Grand Line', type: 'text' },
  { key: 'currency', value: 'INR', type: 'text' },
  { key: 'currencySymbol', value: '₹', type: 'text' },
  { key: 'contactEmail', value: 'lupeandluxe@gmail.com', type: 'text' },
  { key: 'contactPhone', value: '+91 9654023351', type: 'text' },
  { key: 'announcementText', value: '✦ Free shipping on orders over ₹3,999 ✦', type: 'text' },
  { key: 'announcementActive', value: 'true', type: 'text' },
  { key: 'shippingCharge', value: '199', type: 'text' },
  { key: 'freeShippingMin', value: '3999', type: 'text' },
  { key: 'estimatedDelivery', value: '5-7 business days', type: 'text' },
  { key: 'taxRate', value: '12', type: 'text' },
  { key: 'codFee', value: '0', type: 'text' },
  { key: 'primaryColor', value: '#c8a87c', type: 'text' },
  { key: 'secondaryColor', value: '#1a1a2e', type: 'text' },
];

const defaultCategories = [
  { name: 'Custom Tees', slug: 'custom-tees', description: 'Hand-painted custom t-shirts', order: 1 },
  { name: 'Hoodies', slug: 'hoodies', description: 'Premium hoodies and sweatshirts', order: 2 },
  { name: 'Outerwear', slug: 'outerwear', description: 'Jackets and coats', order: 3 },
  { name: 'Sweaters', slug: 'sweaters', description: 'Knit sweaters and cardigans', order: 4 },
  { name: 'Thrift Vintage', slug: 'thrift-vintage', description: 'Curated vintage finds', order: 5 },
  { name: 'Limited Drops', slug: 'limited-drops', description: 'Exclusive limited editions', order: 6 },
  { name: 'Bottoms', slug: 'bottoms', description: 'Pants and shorts', order: 7 },
  { name: 'Accessories', slug: 'accessories', description: 'Bags, hats, and more', order: 8 },
];

const defaultPages = [
  { slug: 'about', title: 'About Us', content: '<h2>Our Story</h2><p>Lupe & Luxe was born from a love for One Piece and a passion for fashion. We believe every piece of clothing carries a story, just like every pirate crew sails for a dream.</p><p>Our collections blend premium thrift finds with custom handcrafted designs inspired by the world of One Piece.</p>', published: true },
  { slug: 'contact', title: 'Contact Us', content: '<h2>Get in Touch</h2><p>Have a question or want to collaborate? Reach out to us!</p><p>Email: lupeandluxe@gmail.com</p><p>Phone: +91 9654023351</p>', published: true },
  { slug: 'shipping-policy', title: 'Shipping Policy', content: '<h2>Shipping Information</h2><p>Free shipping on orders over ₹3,999. Standard shipping ₹199. Orders are processed within 1-2 business days. Delivery typically takes 5-7 business days across India.</p>', published: true },
  { slug: 'returns', title: 'Return Policy', content: '<h2>Returns & Exchanges</h2><p>We accept returns within 7 days of delivery. Items must be unworn and in original condition. Custom items are non-returnable.</p>', published: true },
  { slug: 'faq', title: 'FAQ', content: '<h2>Frequently Asked Questions</h2><p><strong>How do I track my order?</strong></p><p>You will receive a tracking link once your order is shipped.</p><p><strong>Do you accept returns?</strong></p><p>Yes, within 7 days of delivery.</p><p><strong>What payment methods do you accept?</strong></p><p>We accept UPI, Razorpay, and Cash on Delivery.</p>', published: true },
  { slug: 'privacy', title: 'Privacy Policy', content: '<h2>Privacy Policy</h2><p>Your privacy is important to us. We collect only necessary information to process your orders and improve your experience.</p>', published: true },
  { slug: 'terms', title: 'Terms of Service', content: '<h2>Terms of Service</h2><p>By using Lupe & Luxe, you agree to our terms. All products are subject to availability. Prices may change without notice.</p>', published: true },
];

const defaultHomepageSections = [
  { section: 'Hero Banner', type: 'hero', title: 'Sail the\nGrand Line\nin Style', subtitle: 'New Collection', text: 'Premium thrift & custom clothing — each piece carries the spirit of adventure.', buttonText: 'Explore Collection', buttonLink: '/products', order: 1, active: true },
  { section: 'Collections', type: 'collection', title: 'Shop by Category', subtitle: 'Collections', text: 'Find your next treasure', order: 2, active: true },
  { section: 'Featured', type: 'featured', title: 'Featured Pieces', subtitle: 'Premium Picks', order: 3, active: true },
  { section: 'Promo Banner', type: 'promo', title: 'Why Lupe & Luxe', order: 4, active: true },
  { section: 'Latest', type: 'featured', title: 'Just Arrived', subtitle: 'Fresh Drop', order: 5, active: true },
];

async function seedDefaults() {
  try {
    await connectDB();

    for (const s of defaultSettings) {
      await SiteSetting.findOneAndUpdate({ key: s.key }, s, { upsert: true });
    }
    console.log('✅ Default settings seeded');

    for (const c of defaultCategories) {
      await Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true });
    }
    console.log('✅ Default categories seeded');

    for (const p of defaultPages) {
      await Page.findOneAndUpdate({ slug: p.slug }, p, { upsert: true });
    }
    console.log('✅ Default pages seeded');

    for (const h of defaultHomepageSections) {
      await HomepageSection.findOneAndUpdate({ section: h.section }, h, { upsert: true });
    }
    console.log('✅ Default homepage sections seeded');

    console.log('🎉 All default data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding defaults:', error.message);
    process.exit(1);
  }
}

seedDefaults();
