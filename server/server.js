require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const connectDB = require('./config/db');
const { seedAll } = require('./routes/seed');

const app = express();

async function start() {
  await connectDB();

  const seeded = await seedAll();
  if (Object.keys(seeded).length) {
    console.log('🌱 Database auto-seeded:', JSON.stringify(seeded));
  }

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

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
  app.use('/api/seed', require('./routes/seed').router);

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  const clientDir = path.resolve(__dirname, '..', 'client');
  const clientDist = path.join(clientDir, 'dist');

  if (!fs.existsSync(path.join(clientDist, 'index.html'))) {
    console.log('🔨 Building React frontend...');
    try {
      if (!fs.existsSync(path.join(clientDir, 'node_modules'))) {
        execSync('npm install', { cwd: clientDir, stdio: 'pipe' });
      }
      execSync('npm run build', { cwd: clientDir, stdio: 'pipe' });
      console.log('✅ React frontend built successfully');
    } catch (err) {
      console.error('❌ Failed to build frontend:', err.message);
    }
  }

  if (fs.existsSync(path.join(clientDist, 'index.html'))) {
    console.log('🌐 Serving React frontend from client/dist');
    app.use(express.static(clientDist));
    app.get('*', (req, res) =>
      res.sendFile(path.join(clientDist, 'index.html'))
    );
  } else {
    console.log('📡 client/dist not found — API-only mode');
    app.get('/', (req, res) => res.send('🌊 Lupe & Luxe API is sailing...'));
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🏴‍☠️ Server running on port ${PORT}`));
}

start();
