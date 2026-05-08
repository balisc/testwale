const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || process.env.MONGODB_DIRECT_URI;

if (!uri) {
  console.error('Missing MONGODB_URI or MONGODB_DIRECT_URI environment variable.');
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
});

async function clearDatabase() {
  try {
    await client.connect();
    const db = client.db('testwale_db');
    const result = await db.collection('questions').deleteMany({});
    console.log(`Cleared ${result.deletedCount} question(s) from testwale_db.questions.`);
  } catch (error) {
    console.error('Failed to clear database:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

clearDatabase();
