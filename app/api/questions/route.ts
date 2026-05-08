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
    const collectionName = subject === 'history' ? 'history_questions' : 'questions';
    const collection = db.collection(collectionName);

    let filter: Record<string, unknown> = {};

    const queryFilters: Record<string, unknown>[] = [];

    if (subject) {
      queryFilters.push({ subject: { $regex: new RegExp(`^${escapeRegex(subject)}$`, 'i') } });
    }

    if (topic) {
      queryFilters.push({ topic: { $regex: new RegExp(`^${escapeRegex(topic)}$`, 'i') } });
    }

    const searchFilter = search
      ? {
          $or: [
            { question: { $regex: new RegExp(escapeRegex(search), 'i') } },
            { subject: { $regex: new RegExp(escapeRegex(search), 'i') } },
            { topic: { $regex: new RegExp(escapeRegex(search), 'i') } },
            { askedIn: { $regex: new RegExp(escapeRegex(search), 'i') } },
          ],
        }
      : null;

    if (queryFilters.length && searchFilter) {
      filter = { $and: [...queryFilters, searchFilter] };
    } else if (queryFilters.length) {
      filter = queryFilters.length === 1 ? queryFilters[0] : { $and: queryFilters };
    } else if (searchFilter) {
      filter = searchFilter;
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
