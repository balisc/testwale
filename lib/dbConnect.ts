import clientPromise from './mongodb';

export default async function dbConnect() {
  return clientPromise;
}
