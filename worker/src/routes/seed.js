import { Hono } from 'hono';
import { count, findOne, insertMany, insertOne, updateOne } from '../lib/db.js';
import { hashPassword } from '../lib/auth.js';

const app = new Hono();

const products = [
  { name: 'Straw Hat Crew Premium Tee', slug: 'straw-hat-crew-premium-tee', description: 'Premium heavyweight cotton tee featuring the iconic Straw Hat Jolly Roger. Custom screen-printed with distressed finish for that vintage thrift feel. Every piece is hand-distressed — no two are exactly alike.', price: 1299.00, images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600'], category: 'Custom Tees', tags: ['luffy', 'straw hat', 'crew', 'premium'], size: ['S', 'M', 'L', 'XL', '2XL'], countInStock: 20, rating: 5.0, numReviews: 24, featured: true, visible: true },
  { name: 'Three Swords Vintage Hoodie', slug: 'three-swords-vintage-hoodie', description: 'Heavyweight fleece hoodie with embroidered three-sword motif on the back. Inspired by the Pirate Hunter. Premium stitch detail, oversized fit, and garment-dyed for a lived-in feel.', price: 2499.00, images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600'], category: 'Hoodies', tags: ['zoro', 'swords', 'vintage', 'premium'], size: ['M', 'L', 'XL', '2XL'], countInStock: 12, rating: 4.9, numReviews: 18, featured: true, visible: true },
  { name: 'Grand Line Navigator Tee', slug: 'grand-line-navigator-tee', description: 'Bold graphic tee celebrating the greatest navigator in the East Blue. Features custom map artwork with the Grand Line currents. Soft ringspun cotton with a relaxed fit.', price: 1199.00, images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600'], category: 'Custom Tees', tags: ['nami', 'grand line', 'navigator'], size: ['S', 'M', 'L', 'XL'], countInStock: 25, rating: 4.7, numReviews: 15, featured: true, visible: true },
  { name: 'Soul King Vintage Tee', slug: 'soul-king-vintage-tee', description: 'Limited drop vintage tee featuring the Soul King himself. Acid-wash finish with cracked print effect. Each shirt goes through a unique wash process for a one-of-a-kind look.', price: 1399.00, images: ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600'], category: 'Custom Tees', tags: ['brook', 'soul king', 'vintage', 'limited'], size: ['S', 'M', 'L', 'XL'], countInStock: 8, rating: 4.8, numReviews: 11, featured: true, visible: true },
  { name: 'Thousand Sunny Canvas Jacket', slug: 'thousand-sunny-canvas-jacket', description: 'Hand-painted canvas jacket featuring the Thousand Sunny. Custom artwork by local artists. Durable waxed canvas with brass hardware — built for the Grand Line. Each piece is uniquely hand-painted.', price: 4999.00, images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600'], category: 'Outerwear', tags: ['sunny', 'ship', 'canvas', 'hand-painted', 'premium'], size: ['M', 'L', 'XL'], countInStock: 5, rating: 5.0, numReviews: 7, featured: true, visible: true },
  { name: 'Gum-Gum Vintage Sweater', slug: 'gum-gum-vintage-sweater', description: 'Chunky knit sweater with subtle stretch-arm motif. Thrifted and reworked with custom embroidery. Cozy oversized fit perfect for those New World adventures.', price: 2199.00, images: ['https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600'], category: 'Sweaters', tags: ['luffy', 'gum-gum', 'vintage', 'reworked'], size: ['M', 'L', 'XL', '2XL'], countInStock: 10, rating: 4.6, numReviews: 9, featured: true, visible: true },
  { name: "Wano Samurai Thrift Kimono", slug: 'wano-samurai-thrift-kimono', description: "Authentic vintage kimono reimagined with Wano-inspired embroidery. Each piece is sourced from real vintage kimonos and hand-embroidered with samurai motifs. One-of-a-kind — when it's gone, it's gone.", price: 4499.00, images: ['https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600'], category: 'Thrift Vintage', tags: ['zoro', 'wano', 'samurai', 'kimono', 'limited'], size: ['One Size'], countInStock: 3, rating: 5.0, numReviews: 5, featured: true, visible: true },
  { name: 'Going Merry Denim Jacket', slug: 'going-merry-denim-jacket', description: 'Custom distressed denim jacket with embroidered Going Merry on the back. Raw denim base with hand-applied patches and chain-stitch detailing. A tribute to the first ship.', price: 4599.00, images: ['https://images.unsplash.com/photo-1543076447-215ad79baa4a?w=600'], category: 'Outerwear', tags: ['merry', 'denim', 'custom', 'embroidered'], size: ['M', 'L', 'XL'], countInStock: 6, rating: 4.9, numReviews: 8, featured: true, visible: true },
  { name: 'Fish-Man Island Drop Tee', slug: 'fish-man-island-drop-tee', description: 'Limited edition drop tee celebrating the Fish-Man Island arc. Specialty dip-dye technique with ocean-inspired gradients. Ultra-soft triblend fabric.', price: 1399.00, images: ['https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600'], category: 'Limited Drops', tags: ['fish-man', 'limited', 'dip-dye'], size: ['S', 'M', 'L', 'XL'], countInStock: 15, rating: 4.5, numReviews: 12, featured: false, visible: true },
  { name: 'Pirate King Cargo Pants', slug: 'pirate-king-cargo-pants', description: 'Premium cargo pants with custom embroidered Jolly Roger on cargo flap. Multiple pockets for all your adventure essentials. Heavyweight cotton twill with a relaxed tapered fit.', price: 2799.00, images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600'], category: 'Bottoms', tags: ['cargo', 'pants', 'jolly roger', 'premium'], size: ['30', '32', '34', '36'], countInStock: 10, rating: 4.7, numReviews: 14, featured: false, visible: true },
  { name: 'Vintage Marineford Cap', slug: 'vintage-marineford-cap', description: 'Vintage-style dad cap with embroidered Marineford logo. Washed cotton twill with curved brim and adjustable brass buckle closure. Pre-curved brim, broken-in from day one.', price: 999.00, images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600'], category: 'Accessories', tags: ['cap', 'marineford', 'vintage'], size: ['One Size'], countInStock: 30, rating: 4.4, numReviews: 22, featured: false, visible: true },
  { name: 'Enies Lobby Battle Vest', slug: 'enies-lobby-battle-vest', description: 'Reworked vintage denim vest with custom patches from the Enies Lobby arc. Hand-stitched patches, pins, and embroidery. Each vest tells a different story — truly one of a kind.', price: 3499.00, images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600'], category: 'Thrift Vintage', tags: ['enies lobby', 'vest', 'patches', 'reworked'], size: ['M', 'L', 'XL'], countInStock: 4, rating: 4.8, numReviews: 6, featured: false, visible: true },
  { name: 'All Blue Bucket Hat', slug: 'all-blue-bucket-hat', description: 'Premium bucket hat in All Blue colorway. Reversible design — navy on one side, vibrant blue pattern on the other. Lightweight and packable for your journey across the seas.', price: 1099.00, images: ['https://images.unsplash.com/photo-1556306535-0f09a537f0d3?w=600'], category: 'Accessories', tags: ['bucket hat', 'all blue', 'reversible'], size: ['One Size'], countInStock: 20, rating: 4.3, numReviews: 16, featured: false, visible: true },
  { name: "Sunny Go Keychain Charm", slug: 'sunny-go-keychain-charm', description: "Handcrafted leather keychain featuring the Sunny Go's lion figurehead. Hand-stitched, edge-painted, and finished with brass hardware. A tiny piece of the Thousand Sunny for your everyday carry.", price: 699.00, images: ['https://images.unsplash.com/photo-1606318801954-d46d46d3360a?w=600'], category: 'Accessories', tags: ['keychain', 'sunny', 'leather', 'handmade'], size: ['One Size'], countInStock: 40, rating: 4.3, numReviews: 30, featured: false, visible: true },
  { name: "Zoro's Enma Tote Bag", slug: 'zoros-enma-tote-bag', description: 'Heavy canvas tote with screen-printed Enma sword design. Reinforced stitching, inner pocket, and enough room for all your treasure. Inspired by the black blade that turns its wielder\'s haki black.', price: 1199.00, images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=600'], category: 'Accessories', tags: ['zoro', 'enma', 'tote', 'canvas'], size: ['One Size'], countInStock: 25, rating: 4.5, numReviews: 19, featured: false, visible: true },
  { name: 'Gear Fifth Chrome Tee', slug: 'gear-fifth-chrome-tee', description: 'Limited release celebrating Gear Fifth. Chrome foil print on black heavyweight cotton. The foil reflects light differently from every angle — just like the Drums of Liberation. Extremely limited.', price: 1599.00, images: ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600'], category: 'Limited Drops', tags: ['luffy', 'gear 5', 'chrome', 'limited', 'foil'], size: ['S', 'M', 'L', 'XL', '2XL'], countInStock: 7, rating: 5.0, numReviews: 3, featured: false, visible: true },
];

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
  { key: 'upiEnabled', value: 'true', type: 'text' },
  { key: 'upiId', value: 'lupeandluxe@upi', type: 'text' },
  { key: 'upiHolderName', value: 'Lupe & Luxe', type: 'text' },
  { key: 'upiQrImage', value: '', type: 'text' },
  { key: 'razorpayEnabled', value: 'false', type: 'text' },
  { key: 'razorpayKeyId', value: '', type: 'text' },
  { key: 'razorpayKeySecret', value: '', type: 'text' },
  { key: 'razorpayTestMode', value: 'true', type: 'text' },
  { key: 'codEnabled', value: 'true', type: 'text' },
  { key: 'emailNotifications', value: 'true', type: 'text' },
  { key: 'emailUser', value: '', type: 'text' },
  { key: 'emailPass', value: '', type: 'text' },
];

const defaultCategories = [
  { name: 'Custom Tees', slug: 'custom-tees', description: 'Hand-painted custom t-shirts', order: 1, active: true },
  { name: 'Hoodies', slug: 'hoodies', description: 'Premium hoodies and sweatshirts', order: 2, active: true },
  { name: 'Outerwear', slug: 'outerwear', description: 'Jackets and coats', order: 3, active: true },
  { name: 'Sweaters', slug: 'sweaters', description: 'Knit sweaters and cardigans', order: 4, active: true },
  { name: 'Thrift Vintage', slug: 'thrift-vintage', description: 'Curated vintage finds', order: 5, active: true },
  { name: 'Limited Drops', slug: 'limited-drops', description: 'Exclusive limited editions', order: 6, active: true },
  { name: 'Bottoms', slug: 'bottoms', description: 'Pants and shorts', order: 7, active: true },
  { name: 'Accessories', slug: 'accessories', description: 'Bags, hats, and more', order: 8, active: true },
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

const defaultCoupons = [
  { code: 'WELCOME20', discount: 20, type: 'percentage', minOrder: 999, maxUses: 100, usedCount: 0, active: true },
  { code: 'SAVE500', discount: 500, type: 'fixed', minOrder: 2499, maxUses: 50, usedCount: 0, active: true },
  { code: 'FREESHIP', discount: 199, type: 'fixed', minOrder: 0, maxUses: 200, usedCount: 0, active: true },
  { code: 'LUXE10', discount: 10, type: 'percentage', minOrder: 1499, maxUses: 100, usedCount: 0, active: true },
];

const defaultHomepageSections = [
  { section: 'Hero Banner', type: 'hero', title: 'Sail the\nGrand Line\nin Style', subtitle: 'New Collection', text: 'Premium thrift & custom clothing — each piece carries the spirit of adventure.', buttonText: 'Explore Collection', buttonLink: '/products', order: 1, active: true },
  { section: 'Collections', type: 'collection', title: 'Shop by Category', subtitle: 'Collections', text: 'Find your next treasure', order: 2, active: true },
  { section: 'Featured', type: 'featured', title: 'Featured Pieces', subtitle: 'Premium Picks', order: 3, active: true },
  { section: 'Promo Banner', type: 'promo', title: 'Why Lupe & Luxe', order: 4, active: true },
];

const now = () => new Date();

export async function seedAll(env) {
  const seeded = {};
  if ((await count('products', {})) === 0) {
    await insertMany('products', products.map((p) => ({ ...p, createdAt: now(), updatedAt: now() })));
    seeded.products = products.length;
  }
  if ((await count('users', {})) === 0) {
    await insertOne('users', {
      name: 'Captain', email: 'lupeandluxe@gmail.com', password: await hashPassword('admin123'),
      isAdmin: true, role: 'super_admin', blocked: false, loginAttempts: 0, lockedUntil: null, loginHistory: [],
      createdAt: now(), updatedAt: now(),
    });
    seeded.admin = true;
  }
  if ((await count('sitesettings', {})) === 0) {
    for (const s of defaultSettings) {
      await updateOne('sitesettings', { key: s.key }, { $set: { ...s, updatedAt: now() } }, true);
    }
    seeded.settings = defaultSettings.length;
  }
  if ((await count('categories', {})) === 0) {
    for (const c of defaultCategories) {
      await updateOne('categories', { slug: c.slug }, { $set: { ...c, createdAt: now(), updatedAt: now() } }, true);
    }
    seeded.categories = defaultCategories.length;
  }
  if ((await count('pages', {})) === 0) {
    for (const p of defaultPages) {
      await updateOne('pages', { slug: p.slug }, { $set: { ...p, createdAt: now(), updatedAt: now() } }, true);
    }
    seeded.pages = defaultPages.length;
  }
  if ((await count('homepagesections', {})) === 0) {
    for (const h of defaultHomepageSections) {
      await updateOne('homepagesections', { section: h.section }, { $set: { ...h, createdAt: now(), updatedAt: now() } }, true);
    }
    seeded.homepageSections = defaultHomepageSections.length;
  }
  if ((await count('coupons', {})) === 0) {
    for (const cp of defaultCoupons) {
      await updateOne('coupons', { code: cp.code }, { $set: { ...cp, createdAt: now(), updatedAt: now() } }, true);
    }
    seeded.coupons = defaultCoupons.length;
  }
  return seeded;
}

app.post('/', async (c) => {
  try {
    const seeded = await seedAll(c.env);
    return c.json({ message: 'Seed complete', seeded });
  } catch (err) {
    console.error('[SEED] error:', err.message);
    return c.json({ message: err.message }, 500);
  }
});

export default app;