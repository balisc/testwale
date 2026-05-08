import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import HistoryQuestion from '@/models/HistoryQuestion';

export const dynamic = 'force-dynamic';

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const topic = url.searchParams.get('topic')?.trim();

  if (!topic) {
    return NextResponse.json({ questions: [] });
  }

  try {
    await dbConnect();

    const questions = await HistoryQuestion.find({
      'topic.en': { $regex: new RegExp(`^${escapeRegex(topic)}$`, 'i') },
    })
      .select('-_id')
      .lean();

    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to fetch history questions.' },
      { status: 500 }
    );
  }
}
