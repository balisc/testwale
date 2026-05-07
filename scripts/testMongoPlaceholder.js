const { MongoClient } = require('mongodb');

const password = '1B1a1l1i';
const user = 'balithakuer';
const db = 'testwale_db';
const directHosts = [
  'ac-zmgz2cn-shard-00-02.ixvbrqh.mongodb.net:27017',
  'ac-zmgz2cn-shard-00-00.ixvbrqh.mongodb.net:27017',
  'ac-zmgz2cn-shard-00-01.ixvbrqh.mongodb.net:27017',
].join(',');
const uri = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${directHosts}/${db}?tls=true&replicaSet=atlas-13v2lb-shard-0&authSource=admin&retryWrites=true&w=majority`;
console.log('Testing URI:', uri);

(async () => {
  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      family: 4,
    });
    await client.connect();
    console.log('Connect succeeded with password without brackets');
    await client.close();
  } catch (err) {
    console.error('Connect failed:', err.message);
  }
})();
