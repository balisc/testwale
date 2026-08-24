import { NextResponse } from 'next/server';
import { getSelectedExamContext } from '@/lib/examLearningServer';

export const dynamic = 'force-dynamic';

const PRIVATE_NO_STORE = { 'Cache-Control': 'private, no-store' } as const;

export async function GET() {
  const selected = await getSelectedExamContext();
  if (selected.status === 'unauthenticated') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: PRIVATE_NO_STORE });
  }
  return NextResponse.json(
    { required: selected.status === 'incomplete' },
    { headers: PRIVATE_NO_STORE },
  );
}
