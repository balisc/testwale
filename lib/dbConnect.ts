import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI as string;

if (!uri || !uri.trim()) {
  throw new Error('Missing MONGODB_URI in .env.local. Add your MongoDB connection string and restart.');
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConnection: typeof mongoose | undefined;
}

const globalWithMongoose = globalThis as typeof globalThis & {
  _mongooseConnection?: typeof mongoose;
};

async function dbConnect() {
  if (globalWithMongoose._mongooseConnection?.connection.readyState >= 1) {
    return globalWithMongoose._mongooseConnection;
  }

  await mongoose.connect(uri, {
    autoIndex: false,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  globalWithMongoose._mongooseConnection = mongoose;
  return mongoose;
}

export default dbConnect;
