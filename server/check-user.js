const mongoose = require('mongoose');
mongoose.connect('mongodb://lupeandluxe_db_user:P7ffmJJIM5OQSeYy@ac-ghf8gxl-shard-00-00.hgc8c8q.mongodb.net:27017,ac-ghf8gxl-shard-00-01.hgc8c8q.mongodb.net:27017,ac-ghf8gxl-shard-00-02.hgc8c8q.mongodb.net:27017/lupe-and-luxe?ssl=true&replicaSet=atlas-ddy812-shard-0&authSource=admin&retryWrites=true&w=majority', { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    const user = await mongoose.connection.db.collection('users').findOne({ email: 'lupeandluxe@gmail.com' });
    if (user) {
      console.log('Admin found:', user.name, user.isAdmin ? '(admin)' : '(not admin)');
    } else {
      console.log('Admin NOT found - need to seed');
    }
    process.exit(0);
  })
  .catch(e => { console.error('Connection error:', e.message); process.exit(1); });
