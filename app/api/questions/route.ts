import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

export const dynamic = 'force-dynamic';

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const subject = url.searchParams.get('subject')?.trim();
  const topic = url.searchParams.get('topic')?.trim();
  const search = url.searchParams.get('search')?.trim();

  try {
    const client = await clientPromise;
    const db = client.db('testwale_db');
    const collection = db.collection('questions');

    let filter: Record<string, unknown> = {};

    const filters: Record<string, unknown>[] = [];

    if (subject) {
      filters.push({ subject: { $regex: new RegExp(`^${escapeRegex(subject)}$`, 'i') } });
    }

    if (topic) {
      filters.push({ topic: { $regex: new RegExp(`^${escapeRegex(topic)}$`, 'i') } });
    }

    if (filters.length === 1) {
      filter = filters[0];
    } else if (filters.length > 1) {
      filter = { $and: filters };
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
