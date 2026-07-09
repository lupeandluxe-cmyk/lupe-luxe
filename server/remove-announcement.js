process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://lupeandluxe_db_user:P7ffmJJIM5OQSeYy@ac-ghf8gxl-shard-00-00.hgc8c8q.mongodb.net:27017,ac-ghf8gxl-shard-00-01.hgc8c8q.mongodb.net:27017,ac-ghf8gxl-shard-00-02.hgc8c8q.mongodb.net:27017/lupe-and-luxe?ssl=true&replicaSet=atlas-ddy812-shard-0&authSource=admin&retryWrites=true&w=majority';
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  const db = mongoose.connection.db;
  await db.collection('sitesettings').updateOne(
    { key: 'announcementActive' },
    { $set: { value: 'false', type: 'text' } },
    { upsert: true }
  );
  await db.collection('sitesettings').updateOne(
    { key: 'announcementText' },
    { $set: { value: '', type: 'text' } },
    { upsert: true }
  );
  console.log('Announcement disabled');
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
