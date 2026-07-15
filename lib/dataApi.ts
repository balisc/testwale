const MONGODB_DATA_API_URL = process.env.MONGODB_DATA_API_URL?.trim();
const MONGODB_DATA_API_KEY = process.env.MONGODB_DATA_API_KEY?.trim();

if (!MONGODB_DATA_API_URL) {
  throw new Error('MONGODB_DATA_API_URL is missing in .env.local');
}

if (!MONGODB_DATA_API_KEY) {
  throw new Error('MONGODB_DATA_API_KEY is missing in .env.local');
}

const MONGODB_DATA_API_KEY_VALUE = MONGODB_DATA_API_KEY!;

interface FindOptions {
  dataSource?: string;
  database: string;
  collection: string;
  filter?: Record<string, unknown>;
  projection?: Record<string, number>;
  limit?: number;
  skip?: number;
}

/**
 * Query MongoDB using the Atlas Data API
 */
export async function findDocuments(options: FindOptions) {
  const {
    dataSource = 'Cluster0',
    database,
    collection,
    filter = {},
    projection = {},
    limit,
    skip,
  } = options;

  const body: Record<string, unknown> = {
    dataSource,
    database,
    collection,
    filter,
  };

  if (Object.keys(projection).length > 0) {
    body.projection = projection;
  }

  if (limit !== undefined) {
    body.limit = limit;
  }

  if (skip !== undefined) {
    body.skip = skip;
  }

  const response = await fetch(`${MONGODB_DATA_API_URL}/action/find`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': MONGODB_DATA_API_KEY_VALUE,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Data API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.documents || [];
}

/**
 * Insert a document using the Atlas Data API
 */
export async function insertDocument(
  database: string,
  collection: string,
  document: Record<string, unknown>
) {
  const response = await fetch(`${MONGODB_DATA_API_URL}/action/insertOne`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': MONGODB_DATA_API_KEY_VALUE,
    },
    body: JSON.stringify({
      dataSource: 'Cluster0',
      database,
      collection,
      document,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Data API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.insertedId;
}
