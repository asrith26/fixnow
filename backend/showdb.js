const mongoose = require('mongoose');

async function showDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fixnow');
    console.log('Connected to MongoDB');

    // Get all collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\n=== ${collectionName.toUpperCase()} ===`);
      const docs = await db.collection(collectionName).find({}).toArray();
      if (docs.length === 0) {
        console.log('No documents found.');
      } else {
        docs.forEach((doc, index) => {
          console.log(`Document ${index + 1}:`, JSON.stringify(doc, null, 2));
        });
      }
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

showDatabase();
