require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

connectDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/media', require('./routes/media'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/homepage', require('./routes/homepage'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/pages', require('./routes/pages'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/reports', require('./routes/reports'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const rootDir = path.resolve(__dirname, '..');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(rootDir, 'client', 'dist')));
  app.get('*', (req, res) =>
    res.sendFile(path.join(rootDir, 'client', 'dist', 'index.html'))
  );
} else {
  app.get('/', (req, res) => res.send('🌊 Lupe & Luxe API is sailing...'));
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🏴‍☠️ Server running on port ${PORT}`));
