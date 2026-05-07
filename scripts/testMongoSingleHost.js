const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const line = env.split(/\r?\n/).find((line) => line.startsWith('MONGODB_URI='));
const uri = line ? line.slice('MONGODB_URI='.length).trim() : '';

if (!uri) {
  console.error('Missing MONGODB_URI in .env.local');
  process.exit(1);
}

const match = uri.match(/^mongodb\+srv:\/\/(.+?):(.+?)@cluster0\.ixvbrqh\.mongodb\.net\/(.+)$/);
if (!match) {
  console.error('Unexpected MONGODB_URI format');
  process.exit(1);
}

const username = match[1];
const password = match[2];
const dbAndQuery = match[3];
const [db, query = ''] = dbAndQuery.split('?');
const passwordEncoded = encodeURIComponent(password);
const uriDirect = `mongodb://${username}:${passwordEncoded}@ac-zmgz2cn-shard-00-00.ixvbrqh.mongodb.net:27017/${db}?tls=true&replicaSet=atlas-zmgz2cn-shard-0&authSource=admin&directConnection=true&${query}`;

console.log('Direct host URI:', uriDirect);

(async () => {
  try {
    const client = new MongoClient(uriDirect);
    await client.connect();
    console.log('Direct single-host connection succeeded');
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('Direct single-host failed:', err.message);
    process.exit(1);
  }
})();
