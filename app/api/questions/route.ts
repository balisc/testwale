import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const subject = url.searchParams.get('subject')?.trim();
  const search = url.searchParams.get('search')?.trim();

  try {
    const client = await clientPromise;
    const db = client.db('testwale_db');
    const collection = db.collection('questions');

    let filter = {};

    if (subject) {
      filter = { subject: { $regex: new RegExp(`^${escapeRegex(subject)}$`, 'i') } };
    } else if (search) {
      const term = escapeRegex(search);
      filter = {
        $or: [
          { question: { $regex: new RegExp(term, 'i') } },
          { subject: { $regex: new RegExp(term, 'i') } },
          { topic: { $regex: new RegExp(term, 'i') } },
        ],
      };
    }

    const questions = await collection.find(filter).project({ _id: 0 }).toArray();
    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to fetch questions.' },
      { status: 500 }
    );
  }
}
