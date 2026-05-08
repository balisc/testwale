import { NextResponse } from 'next/server';
import HistoryQuestion from '@/models/HistoryQuestion';
import dbConnect from '@/lib/dbConnect';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const topics = await HistoryQuestion.distinct('topic');

    return NextResponse.json({ topics });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to fetch topics.' },
      { status: 500 }
    );
  }
}