const { Resolver } = require('dns').promises;
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const line = env.split(/\r?\n/).find((line) => line.startsWith('MONGODB_URI='));
const uri = line ? line.slice('MONGODB_URI='.length).trim() : '';

(async () => {
  const resolver = new Resolver();
  resolver.setServers(['8.8.8.8', '8.8.4.4']);
  const url = new URL(uri);
  console.log('parsed host', url.hostname);
  const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${url.hostname}`);
  console.log('srv', srvRecords);
  const txtRecords = await resolver.resolveTxt(url.hostname);
  console.log('txt', txtRecords);
  const txtString = txtRecords.map((parts) => parts.join('')).join('');
  console.log('txtString', txtString);

  const directHosts = srvRecords.map((record) => `${record.name}:${record.port}`).join(',');
  const txtParams = new URLSearchParams(txtString);
  const params = new URLSearchParams(url.searchParams);
  if (!params.has('replicaSet') && txtParams.has('replicaSet')) params.set('replicaSet', txtParams.get('replicaSet'));
  if (!params.has('authSource') && txtParams.has('authSource')) params.set('authSource', txtParams.get('authSource'));
  if (!params.has('tls') && !params.has('ssl')) params.set('tls', 'true');
  if (!params.has('retryWrites') && txtParams.has('retryWrites')) params.set('retryWrites', txtParams.get('retryWrites'));
  if (!params.has('w') && txtParams.has('w')) params.set('w', txtParams.get('w'));

  const auth = url.username
    ? `${encodeURIComponent(decodeURIComponent(url.username))}:${encodeURIComponent(decodeURIComponent(url.password))}`
    : '';
  const db = url.pathname.slice(1);
  console.log('fallback URI', `mongodb://${auth}@${directHosts}/${db}?${params.toString()}`);
})();
