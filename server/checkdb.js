require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const c = await mongoose.connection.db.collection('products').countDocuments();
  console.log('Products:', c);
  const dbName = mongoose.connection.db.databaseName;
  console.log('Database:', dbName);
  process.exit();
})();
