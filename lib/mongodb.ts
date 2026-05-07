import { MongoClient } from 'mongodb';
import { Resolver } from 'dns/promises';

const uri = process.env.MONGODB_URI as string;

if (!uri || !uri.trim()) {
  throw new Error(
    'Missing MONGODB_URI in .env.local. Add your MongoDB Atlas connection string and restart the server.'
  );
}

const dnsResolver = new Resolver();
dnsResolver.setServers(['8.8.8.8', '8.8.4.4']);

function isPlaceholderStylePassword(uriString: string): boolean {
  try {
    const url = new URL(uriString);
    const password = url.password;
    return password.startsWith('<') && password.endsWith('>') && password.length > 2;
  } catch {
    return false;
  }
}

async function buildDirectFallbackUri(srvUri: string): Promise<string | undefined> {
  try {
    const url = new URL(srvUri);
    if (url.protocol !== 'mongodb+srv:') {
      return undefined;
    }

    const clusterHost = url.hostname;
    const srvRecords = await dnsResolver.resolveSrv(`_mongodb._tcp.${clusterHost}`);
    const directHosts = srvRecords.map((record) => `${record.name}:${record.port}`).join(',');

    const txtRecords = await dnsResolver.resolveTxt(clusterHost);
    const txtString = txtRecords.map((parts) => parts.join('')).join('');
    const txtParams = new URLSearchParams(txtString);

    const params = new URLSearchParams(url.searchParams);
    if (!params.has('replicaSet') && txtParams.has('replicaSet')) {
      params.set('replicaSet', txtParams.get('replicaSet') ?? '');
    }
    if (!params.has('authSource') && txtParams.has('authSource')) {
      params.set('authSource', txtParams.get('authSource') ?? 'admin');
    }
    if (!params.has('tls') && !params.has('ssl')) {
      params.set('tls', 'true');
    }
    if (!params.has('retryWrites') && txtParams.has('retryWrites')) {
      params.set('retryWrites', txtParams.get('retryWrites') ?? 'true');
    }
    if (!params.has('w') && txtParams.has('w')) {
      params.set('w', txtParams.get('w') ?? 'majority');
    }

    const encodedAuth = url.username
      ? `${encodeURIComponent(decodeURIComponent(url.username))}:${encodeURIComponent(decodeURIComponent(url.password))}`
      : '';
    const db = url.pathname?.slice(1) ?? '';
    const queryString = params.toString();

    return `mongodb://${encodedAuth}@${directHosts}/${db}${queryString ? `?${queryString}` : ''}`;
  } catch (error) {
    console.warn('Could not build direct fallback URI:', error);
    return undefined;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const connectionOptions = {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  family: 4,
};

async function createClient(): Promise<MongoClient> {
  if (isPlaceholderStylePassword(uri)) {
    throw new Error(
      'The MongoDB password in MONGODB_URI looks like an Atlas placeholder wrapped in < >. Remove the angle brackets from the password or set a correctly encoded MONGODB_DIRECT_URI.'
    );
  }

  const client = new MongoClient(uri, connectionOptions);
  try {
    await client.connect();
    return client;
  } catch (error) {
    const fallbackUri = process.env.MONGODB_DIRECT_URI?.trim() || (await buildDirectFallbackUri(uri));
    if (!fallbackUri) {
      throw error;
    }

    console.warn('Primary MongoDB SRV connection failed. Trying direct host fallback.');
    const fallbackClient = new MongoClient(fallbackUri, connectionOptions);
    await fallbackClient.connect();
    return fallbackClient;
  }
}

const clientPromise = globalThis._mongoClientPromise ?? createClient();
if (!globalThis._mongoClientPromise) {
  globalThis._mongoClientPromise = clientPromise;
}

export default clientPromise;
