const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const line = env.split(/\r?\n/).find((line) => line.startsWith('MONGODB_URI='));
const uri = line ? line.slice('MONGODB_URI='.length).trim() : '';

console.log('MONGODB_URI loaded:', !!uri);
if (!uri) {
  process.exit(1);
}

function buildDirectFallbackUri(srvUri) {
  const prefix = 'mongodb+srv://';
  if (!srvUri.startsWith(prefix)) {
    return undefined;
  }

  const payload = srvUri.slice(prefix.length);
  const authSeparator = payload.lastIndexOf('@');
  if (authSeparator === -1) {
    return undefined;
  }

  const auth = payload.slice(0, authSeparator);
  const hostAndPath = payload.slice(authSeparator + 1);
  const slashIndex = hostAndPath.indexOf('/');
  if (slashIndex === -1) {
    return undefined;
  }

  const dbAndQuery = hostAndPath.slice(slashIndex + 1);
  const [db, query = ''] = dbAndQuery.split('?');
  const [username, password] = auth.split(':');
  const encodedAuth = username
    ? `${encodeURIComponent(username)}:${encodeURIComponent(password ?? '')}`
    : auth;

  const directHosts = [
    'ac-zmgz2cn-shard-00-00.ixvbrqh.mongodb.net:27017',
    'ac-zmgz2cn-shard-00-01.ixvbrqh.mongodb.net:27017',
    'ac-zmgz2cn-shard-00-02.ixvbrqh.mongodb.net:27017',
  ].join(',');

  const params = new URLSearchParams(query);
  if (!params.has('replicaSet')) params.set('replicaSet', 'atlas-zmgz2cn-shard-0');
  if (!params.has('tls') && !params.has('ssl')) params.set('tls', 'true');
  if (!params.has('authSource')) params.set('authSource', 'admin');

  const queryString = params.toString();
  return `mongodb://${encodedAuth}@${directHosts}/${db}${queryString ? `?${queryString}` : ''}`;
}

const fallback = buildDirectFallbackUri(uri);
console.log('fallback URI:', fallback);

(async () => {
  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000, family: 4 });
    await client.connect();
    console.log('SRV connection succeeded');
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('SRV failed:', err.message);
    if (!fallback) {
      process.exit(1);
    }
    try {
      const fallbackClient = new MongoClient(fallback, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000, family: 4 });
      await fallbackClient.connect();
      console.log('Fallback connection succeeded');
      await fallbackClient.close();
      process.exit(0);
    } catch (fallbackErr) {
      console.error('Fallback failed:', fallbackErr.message);
      process.exit(1);
    }
  }
})();
