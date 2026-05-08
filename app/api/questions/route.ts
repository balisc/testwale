import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Question from '@/models/Question';
import HistoryQuestion from '@/models/HistoryQuestion';

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
    await dbConnect();

    const normalizedSubject = subject?.toLowerCase() ?? '';
    const queryFilters: Record<string, unknown>[] = [];

    if (normalizedSubject) {
      queryFilters.push({ subject: { $regex: new RegExp(`^${escapeRegex(normalizedSubject)}$`, 'i') } });
    }

    if (topic) {
      if (normalizedSubject === 'history') {
        queryFilters.push({ 'topic.en': { $regex: new RegExp(`^${escapeRegex(topic)}$`, 'i') } });
      } else {
        queryFilters.push({ topic: { $regex: new RegExp(`^${escapeRegex(topic)}$`, 'i') } });
      }
    }

    const searchFilter = search
      ? {
          $or: [
            { 'question.en': { $regex: new RegExp(escapeRegex(search), 'i') } },
            { 'question.hi': { $regex: new RegExp(escapeRegex(search), 'i') } },
            { subject: { $regex: new RegExp(escapeRegex(search), 'i') } },
            { 'topic.en': { $regex: new RegExp(escapeRegex(search), 'i') } },
            { 'topic.hi': { $regex: new RegExp(escapeRegex(search), 'i') } },
            { askedIn: { $regex: new RegExp(escapeRegex(search), 'i') } },
          ],
        }
      : null;

    let filter: Record<string, unknown> = {};
    if (queryFilters.length && searchFilter) {
      filter = { $and: [...queryFilters, searchFilter] };
    } else if (queryFilters.length) {
      filter = queryFilters.length === 1 ? queryFilters[0] : { $and: queryFilters };
    } else if (searchFilter) {
      filter = searchFilter;
    }

    const collection = normalizedSubject === 'history' ? HistoryQuestion : Question;
    const questions = await collection.find(filter).select('-_id').lean();

    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to fetch questions.' },
      { status: 500 }
    );
  }
}
