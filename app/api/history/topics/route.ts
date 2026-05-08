import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('testwale_db');
    const collection = db.collection('history_questions');

    // Get unique topics
    const topics = await collection.distinct('topic');

    return NextResponse.json({ topics });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to fetch topics.' },
      { status: 500 }
    );
  }
}